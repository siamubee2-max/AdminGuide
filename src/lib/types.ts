export type UrgenceLevel = 'vert' | 'orange' | 'rouge';

export type DocumentCategory = 'tous' | 'sante' | 'energie' | 'pension' | 'banque';

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
}

export interface User {
  name: string;
  avatar: string;
}

export const URGENCE_STYLES = {
  vert: {
    background: '#E8F5E9',
    border: '#4CAF50',
    text: '#2E7D32',
    label: 'Pas urgent',
    icon: '✓',
  },
  orange: {
    background: '#FFF3E0',
    border: '#FF9800',
    text: '#E65100',
    label: 'Cette semaine',
    icon: '!',
  },
  rouge: {
    background: '#FFEBEE',
    border: '#F44336',
    text: '#C62828',
    label: 'Urgent',
    icon: '⚠',
  },
} as const;

export const CATEGORIES = [
  { id: 'tous' as const, label: 'Tous', icon: '📋' },
  { id: 'sante' as const, label: 'Santé', icon: '🏥' },
  { id: 'energie' as const, label: 'Énergie', icon: '💡' },
  { id: 'pension' as const, label: 'Pension', icon: '👴' },
  { id: 'banque' as const, label: 'Banque', icon: '🏦' },
] as const;
