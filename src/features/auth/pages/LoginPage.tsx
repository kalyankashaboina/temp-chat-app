import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginSchema } from '@/features/auth/authSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLoginMutation } from '@/features/api/apiSlice';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/features/auth/authSlice';
import { t } from '@/shared/lib/i18n';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const language = useAppSelector((state) => state.settings?.language || 'en');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    try {
      const result = await login({
        email: parsed.data.email,
        password: parsed.data.password,
      }).unwrap();

      // Update Redux state with user data
      dispatch(setUser(result.data));

      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      const message = error?.data?.message || t('error.generic', language);
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            {t('auth.welcome', language)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.loginSubtitle', language)}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('input.email', language)}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t('input.password', language)}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t('action.forgotPassword', language)}
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                {t('action.login', language)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Demo credentials hint */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-center text-xs text-muted-foreground">
            Demo credentials: <span className="font-mono text-foreground">demo@example.com</span> /{' '}
            <span className="font-mono text-foreground">password123</span>
          </p>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount', language)}{' '}
          <Link
            to="/register"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t('action.createAccount', language)}
          </Link>
        </p>
      </div>
    </div>
  );
}
