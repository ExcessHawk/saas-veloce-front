import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = ['my-children'];

export function useMyChildren() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/members/my-children').then((res) => res.data),
  });
}

