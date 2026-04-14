import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

export function useAcademicYears() {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/api/academic-years').then((res) => res.data),
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/academic-years', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      showSuccess('Año académico creado exitosamente');
    },
    onError: (error) => {
      showApiError(error);
    },
  });
}
