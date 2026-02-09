import { AuthBranding } from '@/frontend/features/auth/components/auth-branding';
import { LanguageSwitcher } from '@/frontend/components/ui/language-switcher';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        <AuthBranding />
      </div>

      {/* Right panel - Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-8 py-16 sm:px-16 lg:bg-[var(--color-bg-primary)]">
        <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-10">
          <LanguageSwitcher variant="login" />
        </div>
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
