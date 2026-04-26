import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['my-children'];

export function useMyChildren() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/members/my-children').then((res) => res.data),
  });
}

export function useLinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parentMemberId, studentMemberId }) =>
      api.post(`/api/members/${parentMemberId}/children`, { studentMemberId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      showSuccess('Hijo vinculado exitosamente');
    },
    onError: (err) => showApiError(err),
  });
}

export function useUnlinkChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parentMemberId, studentMemberId }) =>
      api.delete(`/api/members/${parentMemberId}/children/${studentMemberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      showSuccess('Vínculo eliminado');
    },
    onError: (err) => showApiError(err),
  });
}
