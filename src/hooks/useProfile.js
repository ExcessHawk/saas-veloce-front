import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/auth/me').then((res) => res.data),
  });
}
