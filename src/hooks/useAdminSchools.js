import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useAdminSchools() {
  return useQuery({
    queryKey: ['admin', 'schools'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/schools');
      return data;
    },
  });
}

export function useUpdateSchoolStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/api/admin/schools/${id}`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'schools'] }),
  });
}
