'use client';

import { useTranslations } from 'next-intl';

export function AuthBranding() {
  const t = useTranslations('authLayout');

  const features = [
    t('featureSummaries'),
    t('featurePriority'),
    t('featureScoring'),
    t('featureChat'),
  ];

  return (
    <>
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
          {t('heroTitle1')}
          <br />
          {t('heroTitle2')}
          <br />
          <span className="text-teal-400">{t('heroTitle3')}</span>
        </h2>
        <p className="text-base leading-relaxed text-slate-400 max-w-sm">
          {t('heroSubtitle')}
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {features.map((feature) => (
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
          {t('copyright')}
        </p>
      </div>
    </>
  );
}
