import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useSchool() {
  return useQuery({
    queryKey: ['school'],
    queryFn: () => api.get('/api/schools/me').then((res) => res.data),
  });
}
