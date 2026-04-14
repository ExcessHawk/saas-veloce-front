import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/api/courses').then((res) => res.data),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/courses', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showSuccess('Curso creado exitosamente');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
