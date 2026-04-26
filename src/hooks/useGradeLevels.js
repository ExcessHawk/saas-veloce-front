import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['grade-levels'];

export function useGradeLevels() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/grade-levels').then((r) => r.data),
  });
}

export function useCreateGradeLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/grade-levels', data).then((r) => r.data),
    onSuccess: (created) => {
      qc.setQueryData(KEY, (old) => [...(old ?? []), created].sort((a, b) => a.order - b.order));
      showSuccess('Nivel creado');
    },
    onError: showApiError,
  });
}

export function useUpdateGradeLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/api/grade-levels/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: showApiError,
  });
}

export function useDeleteGradeLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/grade-levels/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old) => (old ?? []).filter((l) => l.id !== id));
      return { prev };
    },
    onError: (err, _, ctx) => { if (ctx?.prev) qc.setQueryData(KEY, ctx.prev); showApiError(err); },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
    onSuccess: () => showSuccess('Nivel eliminado'),
  });
}
