import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['school'];

export function useSchool() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/schools/me').then((res) => res.data),
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch('/api/schools/me', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      showSuccess('Escuela actualizada exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}
