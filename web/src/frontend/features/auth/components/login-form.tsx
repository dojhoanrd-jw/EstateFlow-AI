'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/shared/validations/schemas';
import { APP_ROUTES } from '@/shared/routes/app.routes';
import { Button } from '@/frontend/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError('Invalid email or password. Please try again.');
        return;
      }

      router.push(APP_ROUTES.dashboard);
      router.refresh();
    } catch {
      setServerError('Something went wrong. Please try again later.');
    }
  };

  return (
    <>
      {/* Mobile logo (lg+ has the left brand panel) */}
      <div className="mb-6 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10">
          <Building2 className="text-teal-600" size={22} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
          Estate<span className="text-teal-600">Flow</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
          Welcome back
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      {/* Error alert */}
      {serverError && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm leading-relaxed text-red-700">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div className="space-y-2.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="block h-[48px] w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-teal-500 focus:bg-[var(--color-bg-primary)] focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            {...register('email')}
          />
          {errors.email?.message && (
            <p className="text-xs text-red-500 pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className="block h-[48px] w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-teal-500 focus:bg-[var(--color-bg-primary)] focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            {...register('password')}
          />
          {errors.password?.message && (
            <p className="text-xs text-red-500 pl-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full !h-[48px] !rounded-xl !text-[15px] !font-semibold"
          >
            {isSubmitting ? (
              'Signing in...'
            ) : (
              <>
                Sign in
                <ArrowRight size={16} className="ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-[var(--color-text-tertiary)]">
        AI-powered real estate CRM platform
      </p>
    </>
  );
}
