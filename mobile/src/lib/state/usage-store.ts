import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlanTier = 'free' | 'essential' | 'family';

interface UsageState {
  // Scan tracking
  scansThisMonth: number;
  lastScanDate: string | null;
  monthlyResetDate: string;

  // History tracking for free tier (7-day limit)
  documentViewHistory: { docId: string; viewedAt: string }[];

  // Inactivity tracking (family plan)
  lastActivityDate: string;
  inactivityAlertDays: number;

  // Actions
  incrementScans: () => void;
  canScan: (tier: PlanTier) => boolean;
  getScansRemaining: (tier: PlanTier) => number;
  addDocumentView: (docId: string) => void;
  isDocumentAccessible: (docId: string, tier: PlanTier) => boolean;
  resetMonthlyScans: () => void;
  recordActivity: () => void;
  getDaysInactive: () => number;
  isInactive: () => boolean;
  setInactivityAlertDays: (days: number) => void;
}

const SCAN_LIMITS: Record<PlanTier, number> = {
  free: 2,
  essential: Infinity,
  family: Infinity,
};

const HISTORY_DAYS_LIMIT: Record<PlanTier, number> = {
  free: 7,
  essential: Infinity,
  family: Infinity,
};

const getMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      scansThisMonth: 0,
      lastScanDate: null,
      monthlyResetDate: getMonthKey(),
      documentViewHistory: [],
      lastActivityDate: new Date().toISOString(),
      inactivityAlertDays: 3,

      incrementScans: () => {
        const state = get();
        const currentMonth = getMonthKey();

        // Reset if new month
        if (state.monthlyResetDate !== currentMonth) {
          set({
            scansThisMonth: 1,
            monthlyResetDate: currentMonth,
            lastScanDate: new Date().toISOString(),
          });
        } else {
          set({
            scansThisMonth: state.scansThisMonth + 1,
            lastScanDate: new Date().toISOString(),
          });
        }
      },

      canScan: (tier: PlanTier) => {
        const state = get();
        const currentMonth = getMonthKey();

        // Reset count if new month
        if (state.monthlyResetDate !== currentMonth) {
          return true;
        }

        const limit = SCAN_LIMITS[tier];
        return state.scansThisMonth < limit;
      },

      getScansRemaining: (tier: PlanTier) => {
        const state = get();
        const currentMonth = getMonthKey();

        // Reset count if new month
        if (state.monthlyResetDate !== currentMonth) {
          return SCAN_LIMITS[tier];
        }

        const limit = SCAN_LIMITS[tier];
        if (limit === Infinity) return Infinity;
        return Math.max(0, limit - state.scansThisMonth);
      },

      addDocumentView: (docId: string) => {
        const state = get();
        const now = new Date().toISOString();

        // Remove existing entry for this doc
        const filtered = state.documentViewHistory.filter(h => h.docId !== docId);

        set({
          documentViewHistory: [...filtered, { docId, viewedAt: now }],
        });
      },

      isDocumentAccessible: (docId: string, tier: PlanTier) => {
        const state = get();
        const daysLimit = HISTORY_DAYS_LIMIT[tier];

        if (daysLimit === Infinity) return true;

        const entry = state.documentViewHistory.find(h => h.docId === docId);
        if (!entry) return true; // New document

        const viewedAt = new Date(entry.viewedAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - viewedAt.getTime()) / (1000 * 60 * 60 * 24));

        return daysDiff <= daysLimit;
      },

      resetMonthlyScans: () => {
        set({
          scansThisMonth: 0,
          monthlyResetDate: getMonthKey(),
        });
      },

      recordActivity: () => {
        set({ lastActivityDate: new Date().toISOString() });
      },

      getDaysInactive: () => {
        const state = get();
        const lastActive = new Date(state.lastActivityDate);
        const now = new Date();
        return Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      },

      isInactive: () => {
        const state = get();
        return state.getDaysInactive() >= state.inactivityAlertDays;
      },

      setInactivityAlertDays: (days: number) => {
        set({ inactivityAlertDays: days });
      },
    }),
    {
      name: 'monadmin-usage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to check feature access
export const canAccessFeature = (feature: string, tier: PlanTier): boolean => {
  const featureAccess: Record<string, PlanTier[]> = {
    'voice_reading': ['essential', 'family'],
    'ai_analysis_full': ['essential', 'family'],
    'all_categories': ['essential', 'family'],
    'unlimited_history': ['essential', 'family'],
    'unlimited_scans': ['essential', 'family'],
    'text_search': ['essential', 'family'],
    'voice_search': ['essential', 'family'],
    'multilingual': ['essential', 'family'],
    'family_sharing': ['family'],
    'helper_alerts': ['family'],
    'inactivity_alerts': ['family'],
    'auto_responses': ['family'],
    'deadline_reminders': ['family'],
    'pdf_export': ['family'],
    'priority_support': ['family'],
  };

  const allowedTiers = featureAccess[feature];
  if (!allowedTiers) return true; // Feature not restricted
  return allowedTiers.includes(tier);
};

// Categories available per tier
export const getAvailableCategories = (tier: PlanTier): string[] => {
  if (tier === 'free') {
    return ['sante']; // Only health category for free tier
  }
  return ['sante', 'energie', 'pension', 'banque', 'impots', 'assurance', 'juridique', 'medical'];
};
