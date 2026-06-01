import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

vi.mock('@/store/app-store', () => ({
  useAppStore: { getState: () => ({ logout: vi.fn() }) },
}));

describe('api client error handling', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('suppresses global toast spam for optional GET 404s so panels can render inline errors', async () => {
    const handlers: Array<(error: unknown) => unknown> = [];
    vi.spyOn(axios, 'create').mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn((_success, errorHandler) => handlers.push(errorHandler)) },
      },
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as ReturnType<typeof axios.create>);

    await import('@/api-client/client');

    await expect(
      handlers[0]({
        config: { method: 'get', url: '/missing' },
        response: { status: 404, data: { message: 'Missing' }, headers: {} },
        message: 'Missing',
      }),
    ).rejects.toBeTruthy();

    expect(toast.error).not.toHaveBeenCalled();
  });
});
