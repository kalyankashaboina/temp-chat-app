import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@/features/auth/authSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '@/features/api/apiSlice';
import { useAppSelector } from '@/store';
import { t } from '@/shared/lib/i18n';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const language = useAppSelector(state => state.settings?.language || 'en');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod validation
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    try {
      await forgotPassword({ email: parsed.data.email }).unwrap();
      setIsSubmitted(true);
    } catch (error: any) {
      const message = error?.data?.message || t('error.generic', language);
      toast.error(message);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-online/10">
            <CheckCircle className="h-8 w-8 text-status-online" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('auth.resetSent', language)}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('auth.resetSentDesc', language)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Sent to: <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <Link to="/login">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('action.backToLogin', language)}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            {t('auth.forgotTitle', language)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.forgotSubtitle', language)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              t('action.resetPassword', language)
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('action.backToLogin', language)}
          </Link>
        </div>
      </div>
    </div>
  );
}
