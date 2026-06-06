import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyCourses } from './useMyCourses';

vi.mock('@/lib/axios', () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

import api from '@/lib/axios';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMyCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps paginated envelope to a plain array', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{ id: '1', name: 'Math' }, { id: '2', name: 'Physics' }],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => useMyCourses(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].name).toBe('Math');
  });

  it('accepts a bare array response for backward compatibility', async () => {
    api.get.mockResolvedValue({ data: [{ id: '1', name: 'Math' }] });

    const { result } = renderHook(() => useMyCourses(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: '1', name: 'Math' }]);
  });
});
