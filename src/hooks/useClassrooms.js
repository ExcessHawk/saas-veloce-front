import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['classrooms'];

export function useClassrooms() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/classrooms?limit=200').then((res) => res.data.data),
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/classrooms', data).then((res) => res.data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEY, (old) => [...(old ?? []), created]);
      showSuccess('Aula creada exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/api/classrooms/${id}`, data).then((res) => res.data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...data } : c)) ?? [],
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Aula actualizada exitosamente'),
  });
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/classrooms/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) => old?.filter((c) => c.id !== id) ?? []);
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Aula eliminada exitosamente'),
  });
}
