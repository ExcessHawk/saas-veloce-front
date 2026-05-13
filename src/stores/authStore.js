import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    
  persist(
    (set, get) => ({
      isAuthenticated: () => get().accessToken !== null && get().user !== null,
      
      // ─── Estado ───
      accessToken: null,
      refreshToken: null,
      user: null,       // { id, email, fullName, role, ... }
      schoolId: null,   // UUID string
      memberId: null,   // school_members.id for the current session

      // ─── Acciones ───

      /**
       * Guardar sesión completa después de login/register/provision.
       */
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      setSchoolId: (schoolId) => set({ schoolId }),

      setMemberId: (memberId) => set({ memberId }),

      /**
       * Limpiar toda la sesión.
       */
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          schoolId: null,
          memberId: null,
        }),

      /**
       * Actualizar solo los tokens.
       */
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage',
    }
  )
);