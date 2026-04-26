import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const enrollmentsKey = (courseId) => ['enrollments', courseId];

export function useEnrollments(courseId) {
  return useQuery({
    queryKey: enrollmentsKey(courseId),
    queryFn: () => api.get(`/api/courses/${courseId}/enrollments?limit=200`).then((res) => res.data.data),
    enabled: !!courseId,
  });
}

export function useEnrollStudent(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentMemberId) =>
      api.post(`/api/courses/${courseId}/enrollments`, { studentMemberId }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentsKey(courseId) });
      showSuccess('Alumno inscrito exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useRemoveEnrollment(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId) => api.delete(`/api/courses/${courseId}/enrollments/${enrollmentId}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: enrollmentsKey(courseId) });
      const previous = queryClient.getQueryData(enrollmentsKey(courseId));
      queryClient.setQueryData(enrollmentsKey(courseId), (old) => old?.filter((e) => e.id !== id) ?? []);
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(enrollmentsKey(courseId), context.previous);
      showApiError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: enrollmentsKey(courseId) }),
    onSuccess: () => showSuccess('Alumno removido del curso'),
  });
}

export function useAssignTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, teacherMemberId }) =>
      api.patch(`/api/courses/${courseId}/teacher`, { teacherMemberId }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      showSuccess('Docente asignado exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}
