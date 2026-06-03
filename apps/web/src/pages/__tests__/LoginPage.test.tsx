import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../LoginPage';
import { useAppStore } from '@/store/app-store';

const { getSettingsMock, oauthLoginMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  oauthLoginMock: vi.fn(),
}));

vi.mock('@netlify/identity', () => {
  class AuthError extends Error {
    status?: number;
  }

  class MissingIdentityError extends Error {}

  return {
    AuthError,
    MissingIdentityError,
    getSettings: getSettingsMock,
    login: vi.fn(),
    oauthLogin: oauthLoginMock,
    signup: vi.fn(),
  };
});

vi.mock('@/lib/netlifyIdentityAuth', () => ({
  hydrateNetlifyIdentityUser: vi.fn().mockResolvedValue(null),
  isEmailVerified: vi.fn().mockReturnValue(true),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage OAuth providers', () => {
  beforeEach(() => {
    getSettingsMock.mockReset();
    oauthLoginMock.mockReset();
    useAppStore.setState({ user: null, isAuthenticated: false });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a button for each enabled OAuth provider reported by Netlify Identity', async () => {
    getSettingsMock.mockResolvedValue({
      external: { google: true, github: true },
      providers: { google: true, github: true },
    });

    renderLoginPage();

    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
  });

  it('does not render GitHub when the active auth provider has not enabled it', async () => {
    getSettingsMock.mockResolvedValue({
      external: { google: true, github: false },
      providers: { google: true, github: false },
    });

    renderLoginPage();

    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with github/i })).not.toBeInTheDocument();
  });

  it('starts the GitHub OAuth flow when the GitHub button is clicked', async () => {
    getSettingsMock.mockResolvedValue({
      external: { github: true },
      providers: { github: true },
    });

    renderLoginPage();

    await userEvent.click(await screen.findByRole('button', { name: /continue with github/i }));

    expect(oauthLoginMock).toHaveBeenCalledWith('github');
  });
});
