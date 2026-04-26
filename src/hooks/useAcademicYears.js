import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['academic-years'];

export function useAcademicYears() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/academic-years?limit=200').then((res) => res.data.data),
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/academic-years', data).then((res) => res.data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEY, (old) => [...(old ?? []), created]);
      showSuccess('Año académico creado exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/api/academic-years/${id}`, data).then((res) => res.data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) =>
        old?.map((y) => (y.id === id ? { ...y, ...data } : y)) ?? [],
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Año académico actualizado exitosamente'),
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/academic-years/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) => old?.filter((y) => y.id !== id) ?? []);
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Año académico eliminado exitosamente'),
  });
}
