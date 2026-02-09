export type UrgenceLevel = 'vert' | 'orange' | 'rouge';

export type DocumentCategory = 'tous' | 'sante' | 'energie' | 'pension' | 'banque' | 'impots' | 'assurance' | 'juridique' | 'medical';

export interface Document {
  id: number;
  type: string;
  organisme: string;
  titre: string;
  urgence: UrgenceLevel;
  urgenceLabel: string;
  urgenceIcon: string;
  montant?: string;
  dateLimite?: string;
  explication: string;
  action: string;
  categorie: DocumentCategory;
  imageUri?: string;
  dateAjout: string;
  contenuBrut?: string;
}

export interface User {
  name: string;
  avatar: string;
}

export const URGENCE_STYLES = {
  vert: {
    background: '#D1FAE5',
    border: '#10B981',
    text: '#059669',
    label: 'Pas urgent',
    icon: '✓',
    gradient: ['#D1FAE5', '#A7F3D0'] as const,
  },
  orange: {
    background: '#FEF3C7',
    border: '#F59E0B',
    text: '#D97706',
    label: 'Cette semaine',
    icon: '⏰',
    gradient: ['#FEF3C7', '#FDE68A'] as const,
  },
  rouge: {
    background: '#FEE2E2',
    border: '#EF4444',
    text: '#DC2626',
    label: 'Urgent',
    icon: '⚠️',
    gradient: ['#FEE2E2', '#FECACA'] as const,
  },
} as const;

export const CATEGORIES = [
  { id: 'tous' as const, label: 'Tous', icon: '📋' },
  { id: 'sante' as const, label: 'Santé', icon: '🏥' },
  { id: 'energie' as const, label: 'Énergie', icon: '💡' },
  { id: 'pension' as const, label: 'Pension', icon: '👴' },
  { id: 'banque' as const, label: 'Banque', icon: '🏦' },
  { id: 'impots' as const, label: 'Impôts', icon: '📊' },
  { id: 'assurance' as const, label: 'Assurance', icon: '🏠' },
  { id: 'juridique' as const, label: 'Juridique', icon: '⚖️' },
  { id: 'medical' as const, label: 'Médical', icon: '🩺' },
] as const;
