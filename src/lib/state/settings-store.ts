import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSize = 'normal' | 'grand' | 'tres_grand';
export type VoiceSpeed = 'lent' | 'normal' | 'rapide';

interface UserProfile {
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  avatar: string;
}

interface Aidant {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  relation: string;
  notificationsUrgentes: boolean;
}

interface Settings {
  // Profil
  profile: UserProfile;
  
  // Affichage
  taillePolice: FontSize;
  modeSombre: boolean;
  contrasteEleve: boolean;
  
  // Son et voix
  volumeVocal: number;
  vitesseVocale: VoiceSpeed;
  vibrationsActives: boolean;
  
  // Notifications
  notificationsActives: boolean;
  rappelsJoursAvant: number[];
  sonsNotification: boolean;
  
  // Famille
  aidants: Aidant[];
  
  // Métadonnées
  onboardingComplete: boolean;
  lastSyncDate: string | null;
}

interface SettingsStore extends Settings {
  // Actions profil
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Actions affichage
  setTaillePolice: (size: FontSize) => void;
  toggleModeSombre: () => void;
  toggleContrasteEleve: () => void;
  
  // Actions son
  setVolumeVocal: (volume: number) => void;
  setVitesseVocale: (speed: VoiceSpeed) => void;
  toggleVibrations: () => void;
  
  // Actions notifications
  toggleNotifications: () => void;
  setRappelsJours: (jours: number[]) => void;
  toggleSonsNotification: () => void;
  
  // Actions aidants
  addAidant: (aidant: Omit<Aidant, 'id'>) => void;
  removeAidant: (id: string) => void;
  updateAidant: (id: string, data: Partial<Aidant>) => void;
  
  // Persistence
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  
  // Onboarding
  completeOnboarding: () => void;
}

const STORAGE_KEY = 'monadmin_settings';

const DEFAULT_SETTINGS: Settings = {
  profile: {
    prenom: 'Marie',
    nom: '',
    telephone: '',
    adresse: '',
    avatar: '👵',
  },
  taillePolice: 'normal',
  modeSombre: false,
  contrasteEleve: false,
  volumeVocal: 80,
  vitesseVocale: 'normal',
  vibrationsActives: true,
  notificationsActives: true,
  rappelsJoursAvant: [1, 3, 7],
  sonsNotification: true,
  aidants: [],
  onboardingComplete: false,
  lastSyncDate: null,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  updateProfile: (profileUpdate) => {
    set((state) => ({
      profile: { ...state.profile, ...profileUpdate },
    }));
    get().saveSettings();
  },

  setTaillePolice: (size) => {
    set({ taillePolice: size });
    get().saveSettings();
  },

  toggleModeSombre: () => {
    set((state) => ({ modeSombre: !state.modeSombre }));
    get().saveSettings();
  },

  toggleContrasteEleve: () => {
    set((state) => ({ contrasteEleve: !state.contrasteEleve }));
    get().saveSettings();
  },

  setVolumeVocal: (volume) => {
    set({ volumeVocal: Math.max(0, Math.min(100, volume)) });
    get().saveSettings();
  },

  setVitesseVocale: (speed) => {
    set({ vitesseVocale: speed });
    get().saveSettings();
  },

  toggleVibrations: () => {
    set((state) => ({ vibrationsActives: !state.vibrationsActives }));
    get().saveSettings();
  },

  toggleNotifications: () => {
    set((state) => ({ notificationsActives: !state.notificationsActives }));
    get().saveSettings();
  },

  setRappelsJours: (jours) => {
    set({ rappelsJoursAvant: jours });
    get().saveSettings();
  },

  toggleSonsNotification: () => {
    set((state) => ({ sonsNotification: !state.sonsNotification }));
    get().saveSettings();
  },

  addAidant: (aidantData) => {
    const newAidant: Aidant = {
      ...aidantData,
      id: Date.now().toString(),
    };
    set((state) => ({
      aidants: [...state.aidants, newAidant],
    }));
    get().saveSettings();
  },

  removeAidant: (id) => {
    set((state) => ({
      aidants: state.aidants.filter((a) => a.id !== id),
    }));
    get().saveSettings();
  },

  updateAidant: (id, data) => {
    set((state) => ({
      aidants: state.aidants.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    }));
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        set({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const state = get();
      const toSave: Settings = {
        profile: state.profile,
        taillePolice: state.taillePolice,
        modeSombre: state.modeSombre,
        contrasteEleve: state.contrasteEleve,
        volumeVocal: state.volumeVocal,
        vitesseVocale: state.vitesseVocale,
        vibrationsActives: state.vibrationsActives,
        notificationsActives: state.notificationsActives,
        rappelsJoursAvant: state.rappelsJoursAvant,
        sonsNotification: state.sonsNotification,
        aidants: state.aidants,
        onboardingComplete: state.onboardingComplete,
        lastSyncDate: state.lastSyncDate,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
    get().saveSettings();
  },
}));

// Helper pour obtenir la taille de police en pixels
export function getFontSizeMultiplier(size: FontSize): number {
  switch (size) {
    case 'grand':
      return 1.2;
    case 'tres_grand':
      return 1.4;
    default:
      return 1;
  }
}

// Helper pour obtenir la vitesse de la voix
export function getVoiceRate(speed: VoiceSpeed): number {
  switch (speed) {
    case 'lent':
      return 0.7;
    case 'rapide':
      return 1.1;
    default:
      return 0.85;
  }
}
