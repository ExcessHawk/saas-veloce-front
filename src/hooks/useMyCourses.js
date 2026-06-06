import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

/**
 * Reads the role-aware list of courses for the current user.
 *
 * Backend returns a paginated envelope `{ data, total, page, limit,
 * totalPages }`. The default consumer pattern (`myCourses.data.map(...)`) is
 * preserved by unwrapping the envelope here — `query.data` resolves to the
 * array directly. Pagination metadata is exposed via `useMyCoursesPage` when
 * a page actually needs it.
 */
export function useMyCourses(params = {}) {
  const { page = 1, limit = 200 } = params;
  return useQuery({
    queryKey: ['my-courses', page, limit],
    queryFn: () =>
      api
        .get('/api/courses/me', { params: { page, limit } })
        .then((res) => res.data),
    select: (envelope) => {
      if (Array.isArray(envelope)) return envelope;
      return envelope?.data ?? [];
    },
  });
}

/**
 * Same source as `useMyCourses` but returns the full envelope so callers
 * that need totals / page numbers (admin panels, paginated tables) get them.
 */
export function useMyCoursesPage(params = {}) {
  const { page = 1, limit = 50 } = params;
  return useQuery({
    queryKey: ['my-courses-page', page, limit],
    queryFn: () =>
      api
        .get('/api/courses/me', { params: { page, limit } })
        .then((res) => res.data),
    select: (envelope) => {
      if (Array.isArray(envelope)) {
        return { data: envelope, total: envelope.length, page: 1, limit: envelope.length, totalPages: 1 };
      }
      return envelope;
    },
  });
}
