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

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/forgot-password', data).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/reset-password', data).then((r) => r.data),
  });
}

export function useVerifyEmail(token) {
  return useMutation({
    mutationFn: () => api.get(`/api/auth/verify-email?token=${token}`).then((r) => r.data),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => api.post('/api/auth/resend-verification').then((r) => r.data),
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/accept-invitation', data).then((r) => r.data),
  });
}
