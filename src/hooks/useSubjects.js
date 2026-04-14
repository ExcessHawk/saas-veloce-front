import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/api/subjects').then((res) => res.data),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/subjects', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      showSuccess('Materia creada exitosamente');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
