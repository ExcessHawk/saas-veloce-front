import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showSuccess, showApiError } from '@/lib/errors';

const KEY = ['profile'];

export function useProfile() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/api/auth/me').then((res) => res.data),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch('/api/auth/profile', data).then((res) => res.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEY, updated);
      showSuccess('Perfil actualizado exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => api.patch('/api/auth/password', data).then((res) => res.data),
    onSuccess: () => showSuccess('Contraseña actualizada exitosamente'),
    onError: (error) => showApiError(error),
  });
}
