import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — inyecta Authorization y X-School-ID
api.interceptors.request.use((config) => {
  const { accessToken, schoolId } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (schoolId) config.headers['X-School-ID'] = schoolId;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) throw new Error('No refresh token available');

      // Usar axios directo para evitar loop de interceptores
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken }
      );

      useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);


export function extractErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status === 429) {
    return 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.';
  }

  if (error.request && !error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  return 'Ha ocurrido un error inesperado.';
}

export default api;