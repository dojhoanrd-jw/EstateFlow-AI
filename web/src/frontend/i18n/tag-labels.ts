import type { Locale } from './config';

const labels: Record<Locale, Record<string, string>> = {
  en: {
    'hot-lead': 'Hot Lead',
    'cold-lead': 'Cold Lead',
    'pricing': 'Pricing',
    'financing': 'Financing',
    'site-visit': 'Site Visit',
    'follow-up': 'Follow Up',
    'urgent': 'Urgent',
    'investor': 'Investor',
    'first-home': 'First Home',
    'family': 'Family',
    'premium': 'Premium',
    'comparison': 'Comparison',
    'early-stage': 'Early Stage',
    'infonavit': 'Infonavit',
    'documentation': 'Documentation',
    'negotiation': 'Negotiation',
  },
  es: {
    'hot-lead': 'Lead caliente',
    'cold-lead': 'Lead frío',
    'pricing': 'Precios',
    'financing': 'Financiamiento',
    'site-visit': 'Visita al sitio',
    'follow-up': 'Seguimiento',
    'urgent': 'Urgente',
    'investor': 'Inversionista',
    'first-home': 'Primera vivienda',
    'family': 'Familiar',
    'premium': 'Premium',
    'comparison': 'Comparativa',
    'early-stage': 'Etapa inicial',
    'infonavit': 'Infonavit',
    'documentation': 'Documentación',
    'negotiation': 'Negociación',
  },
};

export function getTagLabel(tag: string, locale: Locale): string {
  const key = tag.toLowerCase().trim();
  return labels[locale]?.[key] ?? tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');
}
