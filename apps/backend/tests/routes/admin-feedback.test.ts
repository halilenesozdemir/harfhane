import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

const ADMIN_SECRET = 'local-test-admin-secret';

beforeEach(async () => {
  await applySchema(env.DB);
});

async function insertRow(status: 'new' | 'seen' | 'done'): Promise<number> {
  const result = await env.DB
    .prepare(`INSERT INTO feedback (kind, message, app_platform, status) VALUES ('general', 'x', 'web', ?)`)
    .bind(status)
    .run();
  return result.meta.last_row_id as number;
}

describe('admin feedback routes', () => {
  it('rejects a GET without the admin secret', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/feedback');
    expect(res.status).toBe(401);
  });

  it('filters by status and shows an updated status after PATCH (013-AE6)', async () => {
    await insertRow('new');
    const seenId = await insertRow('seen');
    await insertRow('done');

    const filtered = await SELF.fetch('http://example.com/api/admin/feedback?status=new', {
      headers: { 'X-Admin-Secret': ADMIN_SECRET },
    });
    const filteredBody = (await filtered.json()) as { data: Array<{ status: string }> };
    expect(filteredBody.data).toHaveLength(1);
    expect(filteredBody.data[0]?.status).toBe('new');

    const patch = await SELF.fetch(`http://example.com/api/admin/feedback/${seenId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ status: 'done' }),
    });
    expect(patch.status).toBe(200);

    const all = await SELF.fetch('http://example.com/api/admin/feedback', { headers: { 'X-Admin-Secret': ADMIN_SECRET } });
    const allBody = (await all.json()) as { data: Array<{ id: number; status: string }> };
    expect(allBody.data.find((r) => r.id === seenId)?.status).toBe('done');
  });
});
