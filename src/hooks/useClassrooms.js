import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const studentsKey = (id) => ['classroom-students', id];

export function useClassroomStudents(classroomId) {
  return useQuery({
    queryKey: studentsKey(classroomId),
    queryFn: () => api.get(`/api/classrooms/${classroomId}/students`).then((r) => r.data),
    enabled: !!classroomId,
  });
}

export function useAddClassroomStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomId, studentMemberId }) =>
      api.post(`/api/classrooms/${classroomId}/students`, { studentMemberId }).then((r) => r.data),
    onSuccess: (_data, { classroomId }) => {
      queryClient.invalidateQueries({ queryKey: studentsKey(classroomId) });
      showSuccess('Alumno asignado al aula');
    },
    onError: (error) => showApiError(error),
  });
}

export function useRemoveClassroomStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomId, studentId }) =>
      api.delete(`/api/classrooms/${classroomId}/students/${studentId}`),
    onSuccess: (_data, { classroomId }) => {
      queryClient.invalidateQueries({ queryKey: studentsKey(classroomId) });
      showSuccess('Alumno removido del aula');
    },
    onError: (error) => showApiError(error),
  });
}

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
