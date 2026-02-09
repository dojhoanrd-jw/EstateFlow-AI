import { LanguageSwitcher } from '@/frontend/components/ui/language-switcher';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden px-4 py-6">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="login" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center flex-1">
        {children}
      </div>
    </div>
  );
}
