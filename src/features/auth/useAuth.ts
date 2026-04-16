import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  loginUser, registerUser, forgotPasswordAction, logoutUser, logoutUserAsync, setLanguage, selectAuth,
} from '@/features/auth/authSlice';
import { disconnectSocket } from '@/shared/services/socket';
import type { Language } from '@/features/chat/types';
import { t } from '@/shared/lib/i18n';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isLoading, language } = useAppSelector(selectAuth);

  const translate = useCallback((key: Parameters<typeof t>[0]) => t(key, language), [language]);

  const login = useCallback(async (email: string, password: string) => {
    try { await dispatch(loginUser({ email, password })).unwrap(); return { success: true }; }
    catch (error) { return { success: false, error: error as string }; }
  }, [dispatch]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try { await dispatch(registerUser({ name, email, password })).unwrap(); return { success: true }; }
    catch (error) { return { success: false, error: error as string }; }
  }, [dispatch]);

  const forgotPassword = useCallback(async (email: string) => {
    try { await dispatch(forgotPasswordAction({ email })).unwrap(); return { success: true }; }
    catch (error) { return { success: false, error: error as string }; }
  }, [dispatch]);

  const logout = useCallback(() => {
    disconnectSocket();
    dispatch(logoutUserAsync());
  }, [dispatch]);

  const changeLanguage = useCallback((lang: Language) => { dispatch(setLanguage(lang)); }, [dispatch]);

  return { user, isLoading, language, login, register, forgotPassword, logout, setLanguage: changeLanguage, translate };
}
