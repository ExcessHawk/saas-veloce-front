import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const tasksKey = (courseId) => ['tasks', courseId];

export function useTasks(courseId) {
  return useQuery({
    queryKey: tasksKey(courseId),
    queryFn: () => api.get(`/api/courses/${courseId}/tasks?limit=200`).then((res) => res.data.data),
    enabled: !!courseId,
  });
}

export function useCreateTask(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/api/courses/${courseId}/tasks`, data).then((res) => res.data),
    onSuccess: (created) => {
      queryClient.setQueryData(tasksKey(courseId), (old) => [created, ...(old ?? [])]);
      showSuccess('Tarea creada exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useUpdateTask(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/api/courses/${courseId}/tasks/${id}`, data).then((res) => res.data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey(courseId) });
      const previous = queryClient.getQueryData(tasksKey(courseId));
      queryClient.setQueryData(tasksKey(courseId), (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...data } : t)) ?? [],
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey(courseId), context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey(courseId) }),
    onSuccess: () => showSuccess('Tarea actualizada exitosamente'),
  });
}

export function useDeleteTask(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/courses/${courseId}/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tasksKey(courseId) });
      const previous = queryClient.getQueryData(tasksKey(courseId));
      queryClient.setQueryData(tasksKey(courseId), (old) => old?.filter((t) => t.id !== id) ?? []);
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey(courseId), context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKey(courseId) }),
    onSuccess: () => showSuccess('Tarea eliminada exitosamente'),
  });
}
