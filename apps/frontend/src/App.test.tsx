import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AppRoutes } from './App';

vi.mock('./components/HomePage', () => ({
  default: function MockHomePage(): React.JSX.Element {
    return <div data-testid="home-page" />;
  },
}));

vi.mock('./components/AuthModal', () => ({
  default: function MockAuthModal(): null {
    return null;
  },
}));

vi.mock('./components/InstallPrompt', () => ({
  default: function MockInstallPrompt(): null {
    return null;
  },
}));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    googleAuthFailed: false,
    justLoggedIn: false,
    clearJustLoggedIn: vi.fn(),
    user: null,
  }),
}));

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe('AppRoutes', () => {
  it('should redirect the retired password reset link to the home page', async () => {
    render(
      <MemoryRouter initialEntries={['/sifre-sifirla?token=abc']}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
});
