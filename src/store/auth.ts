import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, AdminRole } from '@/types';

interface AuthState {
  user: Profile | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setRole: (role: AdminRole) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          role: user?.role as AdminRole | null,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'weaz-auth',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
);
