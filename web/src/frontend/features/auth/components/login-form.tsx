'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/shared/validations/schemas';
import { APP_ROUTES } from '@/shared/routes/app.routes';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';

const loginInputClass = 'h-[48px] !rounded-xl !text-[15px] bg-[var(--color-bg-secondary)] focus:bg-[var(--color-bg-primary)] focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const failCountRef = useRef(0);
  const lockedUntilRef = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    if (Date.now() < lockedUntilRef.current) {
      const secondsLeft = Math.ceil((lockedUntilRef.current - Date.now()) / 1000);
      setServerError(t('errorTooManyWait', { seconds: secondsLeft }));
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        failCountRef.current += 1;
        if (failCountRef.current >= 5) {
          lockedUntilRef.current = Date.now() + 30_000;
          failCountRef.current = 0;
          setServerError(t('errorTooMany'));
        } else {
          setServerError(t('errorInvalid'));
        }
        return;
      }

      failCountRef.current = 0;
      router.push(APP_ROUTES.dashboard);
      router.refresh();
    } catch {
      setServerError(t('errorGeneric'));
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10">
            <Building2 className="text-teal-600" size={22} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            Estate<span className="text-teal-600">Flow</span>
          </span>
        </div>
      </div>

      <div className="mb-10">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {t('subtitle')}
        </p>
      </div>

      {serverError && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm leading-relaxed text-red-700">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="email"
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          error={errors.email?.message}
          className={loginInputClass}
          {...register('email')}
        />

        <Input
          id="password"
          type="password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          autoComplete="current-password"
          error={errors.password?.message}
          className={loginInputClass}
          {...register('password')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full !h-[48px] !rounded-xl !text-[15px] !font-semibold"
          >
            {isSubmitting ? (
              t('submitting')
            ) : (
              <>
                {t('submit')}
                <ArrowRight size={16} className="ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-12 text-center text-xs text-[var(--color-text-tertiary)]">
        {t('footer')}
      </p>
    </>
  );
}
