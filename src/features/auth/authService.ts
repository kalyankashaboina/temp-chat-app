import { api } from '@/lib/apiClient';
import type { AuthUser } from '@/features/chat/types';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

interface MeResponse {
  _id: string;
  id?: string;
  username: string;
  email: string;
  avatar?: string;
}

function mapUser(u: MeResponse): AuthUser {
  return {
    id: u._id || u.id || '',
    email: u.email,
    name: u.username,
    avatar: u.avatar || '',
  };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await api.post<{ success: boolean; data: MeResponse }>('/auth/login', { email, password });
      return { success: true, user: mapUser(res.data) };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      const res = await api.post<{ success: boolean; data: MeResponse }>('/auth/register', { username: name, email, password });
      return { success: true, user: mapUser(res.data) };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      await api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
  },

  async getMe(): Promise<AuthUser | null> {
    try {
      const res = await api.get<{ data: MeResponse }>('/auth/me');
      return mapUser(res.data);
    } catch {
      return null;
    }
  },
};
