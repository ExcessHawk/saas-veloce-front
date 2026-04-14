import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useLogin() {
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/auth/login', data).then((res) => res.data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/auth/register', data).then((res) => res.data),
  });
}

export function useProvision() {
  return useMutation({
    mutationFn: (data) =>
      api.post('/api/provision', data).then((res) => res.data),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
  });
}
