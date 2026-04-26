import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get('/api/dashboard/activity').then((r) => r.data),
  });
}
