import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const { data } = await api.get('/api/billing/subscription');
      return data;
    },
    retry: false,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async ({ planCode, currency }) => {
      const { data } = await api.post('/api/billing/checkout', { planCode, currency });
      return data;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/billing/portal');
      return data;
    },
  });
}
