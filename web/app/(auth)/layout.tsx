export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
              <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 22V6l10-4 10 4v16M2 22h20M6 12h.01M10 12h.01M14 12h.01M6 16h.01M10 16h.01M14 16h.01" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Estate<span className="text-teal-400">Flow</span>
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white tracking-tight">
            Manage your
            <br />
            real estate leads
            <br />
            <span className="text-teal-400">with AI power.</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-400 max-w-sm">
            Conversational CRM that uses artificial intelligence to classify, prioritize and summarize your sales conversations in real time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['AI Summaries', 'Priority Detection', 'Lead Scoring', 'Real-time Chat'].map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300"
              >
                <span className="h-1 w-1 rounded-full bg-teal-400" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            &copy; 2025 EstateFlow AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-8 py-16 sm:px-16 lg:bg-[var(--color-bg-primary)]">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
