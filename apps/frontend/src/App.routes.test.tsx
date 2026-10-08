import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './App';

describe('AppRoutes', () => {
  beforeEach(() => {
    // AppRoutes also mounts InstallPrompt, which reads matchMedia on mount;
    // jsdom doesn't implement it.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  it('should render PrivacyPage at /gizlilik instead of redirecting home (007-AE1)', async () => {
    render(
      <MemoryRouter initialEntries={['/gizlilik']}>
        <AppRoutes />
      </MemoryRouter>
    );
    // PrivacyPage is lazy-loaded behind Suspense; wait for the chunk to resolve.
    expect(await screen.findByRole('heading', { name: /gizlilik politikası \(taslak\)/i })).toBeInTheDocument();
  });
});
