import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, createApiClient, REQUEST_TIMEOUT_MS } from './api';

const BASE_URL = 'https://api.example.test/api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function createClient(response: Response) {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
  return { client: createApiClient({ baseUrl: BASE_URL, fetchImpl }), fetchImpl };
}

describe('createApiClient', () => {
  it('should request the daily word without a length param when the length is 5', async () => {
    const daily = { word: { word: 'KALEM' }, gameNumber: 7, date: '2026-10-05' };
    const { client, fetchImpl } = createClient(jsonResponse({ data: daily }));
    await expect(client.fetchDailyWord(5)).resolves.toEqual(daily);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${BASE_URL}/words/daily`);
  });

  it('should add the length param when the length is not 5', async () => {
    const { client, fetchImpl } = createClient(jsonResponse({ data: { word: {}, wordId: 3 } }));
    await client.fetchRandomWord(6);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${BASE_URL}/words/random?length=6`);
  });

  it('should post the guess as JSON when validating a word', async () => {
    const { client, fetchImpl } = createClient(jsonResponse({ data: { isValid: true } }));
    await expect(client.validateWord('KALEM')).resolves.toEqual({ isValid: true });
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ word: 'KALEM' }));
  });

  it('should throw an ApiRequestError with the server code when the response is an error', async () => {
    const { client } = createClient(jsonResponse({ error: { code: 'NOT_FOUND', message: 'Kelime yok' } }, 404));
    await expect(client.fetchDailyWord(4)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Kelime yok' });
  });

  it('should request the playable lengths', async () => {
    const { client, fetchImpl } = createClient(jsonResponse({ data: { lengths: [5] } }));
    await expect(client.fetchPlayableLengths()).resolves.toEqual({ lengths: [5] });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${BASE_URL}/words/lengths`);
  });

  it('should throw an ApiRequestError when the body is not JSON', async () => {
    const { client } = createClient(new Response('<html>', { status: 502 }));
    const error = await client.fetchDailyWord(5).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status: 502, code: 'INVALID_RESPONSE' });
  });

  it('should post the feedback body as JSON and return the stored row', async () => {
    const { client, fetchImpl } = createClient(jsonResponse({ data: { id: 7, status: 'new' } }, 201));
    const input = { kind: 'general' as const, message: 'Harika oyun!', app_platform: 'android' as const };
    await expect(client.submitFeedback(input)).resolves.toEqual({ id: 7, status: 'new' });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${BASE_URL}/feedback`);
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(input));
  });

  it('should throw an ApiRequestError with the server code when feedback submission is rejected (e.g. validation)', async () => {
    const { client } = createClient(jsonResponse({ error: { code: 'VALIDATION_ERROR', message: 'Mesaj gerekli' } }, 422));
    const input = { kind: 'general' as const, message: '', app_platform: 'android' as const };
    await expect(client.submitFeedback(input)).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR', message: 'Mesaj gerekli' });
  });

  it('should reject with the underlying error when the network request fails', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network request failed'));
    const client = createApiClient({ baseUrl: BASE_URL, fetchImpl });
    const input = { kind: 'general' as const, message: 'Test', app_platform: 'android' as const };
    await expect(client.submitFeedback(input)).rejects.toThrow('Network request failed');
  });

  describe('timeout', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // A half-open connection never resolves or rejects fetch on its own; without the
    // AbortController timeout the request promise (and anything awaiting it, e.g.
    // useGame.ts's isInFlight) would hang forever instead of reaching this error path.
    it('should reject with a timeout error when the abort rejection is not an Error instance', async () => {
      vi.useFakeTimers();
      const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject({ name: 'AbortError', message: 'Aborted' }));
          }),
      );
      const client = createApiClient({ baseUrl: BASE_URL, fetchImpl });

      const pending = client.fetchDailyWord(5);
      const assertion = expect(pending).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      await assertion;
      vi.useRealTimers();
    });

    it('should reject with a timeout error when the request exceeds REQUEST_TIMEOUT_MS', async () => {
      vi.useFakeTimers();
      const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const abortError = new Error('Aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          }),
      );
      const client = createApiClient({ baseUrl: BASE_URL, fetchImpl });

      const pending = client.fetchDailyWord(5);
      const assertion = expect(pending).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
      await assertion;
    });

    it('should not time out when the response arrives before REQUEST_TIMEOUT_MS', async () => {
      vi.useFakeTimers();
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ data: { lengths: [5] } }));
      const client = createApiClient({ baseUrl: BASE_URL, fetchImpl });

      await expect(client.fetchPlayableLengths()).resolves.toEqual({ lengths: [5] });
    });
  });
});
