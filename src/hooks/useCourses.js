import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['courses'];

export function useCourses() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/courses?limit=200').then((res) => res.data.data),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/courses', data).then((res) => res.data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEY, (old) => [...(old ?? []), created]);
      showSuccess('Curso creado exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/api/courses/${id}`, data).then((res) => res.data),
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
    onSuccess: () => showSuccess('Curso actualizado exitosamente'),
  });
}

export function useAssignTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacherMemberId }) =>
      api.patch(`/api/courses/${id}/teacher`, { teacherMemberId }).then((res) => res.data),
    onMutate: async ({ id, teacherMemberId }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old) =>
        old?.map((c) => (c.id === id ? { ...c, teacherMemberId } : c)) ?? [],
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Docente asignado exitosamente'),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/courses/${id}`),
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
    onSuccess: () => showSuccess('Curso eliminado exitosamente'),
  });
}
