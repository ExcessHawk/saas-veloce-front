import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

export function useMySubmissions(enabled = true) {
  return useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: () => api.get('/api/submissions/mine').then((r) => r.data),
    enabled,
  });
}

export function useSubmitTask(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content, attachments }) =>
      api
        .post(`/api/courses/${courseId}/tasks/${taskId}/submissions`, { content, attachments })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', 'mine'] });
      showSuccess('Tarea entregada exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useTaskSubmissions(courseId, taskId) {
  return useQuery({
    queryKey: ['submissions', courseId, taskId],
    queryFn: () =>
      api.get(`/api/courses/${courseId}/tasks/${taskId}/submissions`).then((r) => r.data),
    enabled: !!courseId && !!taskId,
  });
}

export function useGradeSubmission(courseId, taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, score, feedback, status }) =>
      api
        .patch(`/api/courses/${courseId}/tasks/${taskId}/submissions/${submissionId}`, {
          score, feedback, status,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', courseId, taskId] });
      showSuccess('Entrega calificada');
    },
    onError: (error) => showApiError(error),
  });
}
