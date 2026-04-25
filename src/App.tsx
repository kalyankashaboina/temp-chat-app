import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from '@/store';
import { initAuth, selectUser, selectIsInitialized } from '@/features/auth/authSlice';
import { SettingsProvider } from '@/features/settings/components/SettingsProvider';
import { socketClient } from '@/features/chat/services/socketClient';
import webrtcService from '@/features/chat/services/webrtcService';
import { ErrorBoundary } from './components/ErrorBoundary';

const Index = lazy(() => import('./pages/Index'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingScreen() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function AuthInit() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const initialized = useAppSelector(selectIsInitialized);

  // Validate session on mount
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Connect socket when authenticated
  useEffect(() => {
    if (user) {
      socketClient.connect();
      // BUG FIX #7: Setup WebRTC listeners after socket connection
      webrtcService.setupWebRTCListeners();
    } else {
      socketClient.disconnect();
    }
  }, [user]);

  if (!initialized) return <LoadingScreen />;
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectUser);
  const initialized = useAppSelector(selectIsInitialized);
  if (!initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectUser);
  const initialized = useAppSelector(selectIsInitialized);
  if (!initialized) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <AuthInit />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AuthRoute>
                  <RegisterPage />
                </AuthRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthRoute>
                  <ForgotPasswordPage />
                </AuthRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
        <SettingsProvider />
      </BrowserRouter>
    </TooltipProvider>
  </Provider>
);

export default App;
