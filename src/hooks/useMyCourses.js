import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useMyCourses() {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/api/courses/me').then((res) => res.data),
  });
}
