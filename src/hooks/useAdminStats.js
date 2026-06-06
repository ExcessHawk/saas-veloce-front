import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

/**
 * Aggregate SaaS metrics for the superadmin panel. Backend computes MRR,
 * subscription counts by status, churn last 30 days, and school counts.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/api/admin/stats').then((r) => r.data),
    staleTime: 60_000,
  });
}
