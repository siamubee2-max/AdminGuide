import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActionType = 
  | 'scan'           // Document scanné
  | 'view'           // Document consulté
  | 'reminder_set'   // Rappel programmé
  | 'reminder_done'  // Rappel effectué
  | 'shared'         // Partagé avec un proche
  | 'deleted'        // Document supprimé
  | 'archived'       // Document archivé
  | 'voice_question' // Question vocale posée
  | 'voice_answer'   // Réponse vocale reçue
  | 'setting_change' // Paramètre modifié
  | 'call_helper'    // Appel à un aidant
  | 'export'         // Export de document
  | 'note_added';    // Note ajoutée

export interface HistoryAction {
  id: string;
  type: ActionType;
  timestamp: number;
  title: string;
  description?: string;
  documentId?: string;
  documentTitle?: string;
  metadata?: Record<string, any>;
}

interface HistoryState {
  actions: HistoryAction[];
  isLoading: boolean;
  
  // Actions
  addAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  getActionsByType: (type: ActionType) => HistoryAction[];
  getActionsByDocument: (documentId: string) => HistoryAction[];
  getRecentActions: (limit?: number) => HistoryAction[];
  getActionsForPeriod: (startDate: Date, endDate: Date) => HistoryAction[];
}

const HISTORY_STORAGE_KEY = 'monadmin_history';
const MAX_HISTORY_ITEMS = 500; // Limite pour éviter trop de données

// Descriptions et icônes pour chaque type d'action
export const ACTION_CONFIG: Record<ActionType, { icon: string; label: string; color: string }> = {
  scan: { icon: '📷', label: 'Scan', color: '#2563EB' },
  view: { icon: '👁️', label: 'Consultation', color: '#6B7280' },
  reminder_set: { icon: '⏰', label: 'Rappel programmé', color: '#F59E0B' },
  reminder_done: { icon: '✅', label: 'Rappel effectué', color: '#10B981' },
  shared: { icon: '🔗', label: 'Partage', color: '#8B5CF6' },
  deleted: { icon: '🗑️', label: 'Suppression', color: '#EF4444' },
  archived: { icon: '📦', label: 'Archivage', color: '#6B7280' },
  voice_question: { icon: '🎤', label: 'Question vocale', color: '#EC4899' },
  voice_answer: { icon: '💬', label: 'Réponse IA', color: '#06B6D4' },
  setting_change: { icon: '⚙️', label: 'Paramètre modifié', color: '#64748B' },
  call_helper: { icon: '📞', label: 'Appel aidant', color: '#22C55E' },
  export: { icon: '📤', label: 'Export', color: '#3B82F6' },
  note_added: { icon: '📝', label: 'Note ajoutée', color: '#A855F7' },
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  actions: [],
  isLoading: false,

  addAction: (actionData) => {
    const newAction: HistoryAction = {
      ...actionData,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => {
      // Ajouter en début et limiter la taille
      const updatedActions = [newAction, ...state.actions].slice(0, MAX_HISTORY_ITEMS);
      
      // Sauvegarder en async
      AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedActions)).catch(console.error);
      
      return { actions: updatedActions };
    });
  },

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const actions = JSON.parse(stored) as HistoryAction[];
        set({ actions, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading history:', error);
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      set({ actions: [] });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  getActionsByType: (type) => {
    return get().actions.filter(a => a.type === type);
  },

  getActionsByDocument: (documentId) => {
    return get().actions.filter(a => a.documentId === documentId);
  },

  getRecentActions: (limit = 20) => {
    return get().actions.slice(0, limit);
  },

  getActionsForPeriod: (startDate, endDate) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return get().actions.filter(a => a.timestamp >= start && a.timestamp <= end);
  },
}));

// Helper pour formater les dates relatives
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Helper pour grouper les actions par jour
export function groupActionsByDay(actions: HistoryAction[]): Map<string, HistoryAction[]> {
  const groups = new Map<string, HistoryAction[]>();
  
  actions.forEach(action => {
    const date = new Date(action.timestamp);
    const key = date.toISOString().split('T')[0];
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(action);
  });
  
  return groups;
}

// Helper pour obtenir le label d'une date groupée
export function getDateGroupLabel(dateKey: string): string {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateKey === today.toISOString().split('T')[0]) {
    return "Aujourd'hui";
  }
  if (dateKey === yesterday.toISOString().split('T')[0]) {
    return 'Hier';
  }
  
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}
