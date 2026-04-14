import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/api/classrooms').then((res) => res.data),
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/classrooms', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      showSuccess('Aula creada exitosamente');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
