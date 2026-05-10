import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — no re-fetch si los datos son recientes
      gcTime:    15 * 60 * 1000,  // 15 min — mantener en memoria al navegar entre páginas
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});