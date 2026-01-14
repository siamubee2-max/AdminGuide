import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type FamilyRole = 'owner' | 'helper' | 'viewer';

export interface FamilyMember {
  id: string;
  prenom: string;
  nom?: string;
  telephone?: string;
  email?: string;
  avatar: string;
  role: FamilyRole;
  dateAjout: string;
  dernierAcces?: string;
  notificationsActives: boolean;
}

export interface SharedDocument {
  documentId: number;
  sharedWith: string[]; // member IDs
  sharedAt: string;
  message?: string;
  notified: boolean;
}

export interface FamilyInvite {
  code: string;
  createdAt: string;
  expiresAt: string;
  role: FamilyRole;
  used: boolean;
}

interface FamilyState {
  members: FamilyMember[];
  sharedDocuments: SharedDocument[];
  pendingInvites: FamilyInvite[];
  isLoading: boolean;

  // Actions
  loadFamily: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id' | 'dateAjout'>) => Promise<FamilyMember>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  
  // Sharing
  shareDocument: (documentId: number, memberIds: string[], message?: string) => Promise<void>;
  unshareDocument: (documentId: number, memberId?: string) => Promise<void>;
  getDocumentShares: (documentId: number) => SharedDocument | undefined;
  getMemberSharedDocuments: (memberId: string) => SharedDocument[];
  
  // Invites
  generateInviteCode: (role: FamilyRole) => Promise<string>;
  validateInviteCode: (code: string) => FamilyInvite | null;
  useInviteCode: (code: string) => Promise<boolean>;
}

const FAMILY_STORAGE_KEY = 'monadmin_family';
const SHARES_STORAGE_KEY = 'monadmin_shared_docs';
const INVITES_STORAGE_KEY = 'monadmin_invites';

// Avatars disponibles pour la famille
export const FAMILY_AVATARS = ['👨', '👩', '👴', '👵', '🧑', '👦', '👧', '🧓', '👨‍🦳', '👩‍🦳'];

// Configuration des rôles
export const ROLE_CONFIG: Record<FamilyRole, { label: string; description: string; color: string; icon: string }> = {
  owner: {
    label: 'Propriétaire',
    description: 'Accès complet à tous les documents et paramètres',
    color: '#7C3AED',
    icon: '👑',
  },
  helper: {
    label: 'Aidant',
    description: 'Peut voir et gérer les documents partagés',
    color: '#2563EB',
    icon: '🤝',
  },
  viewer: {
    label: 'Observateur',
    description: 'Peut uniquement consulter les documents partagés',
    color: '#10B981',
    icon: '👁️',
  },
};

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  sharedDocuments: [],
  pendingInvites: [],
  isLoading: false,

  loadFamily: async () => {
    set({ isLoading: true });
    try {
      const [membersData, sharesData, invitesData] = await Promise.all([
        AsyncStorage.getItem(FAMILY_STORAGE_KEY),
        AsyncStorage.getItem(SHARES_STORAGE_KEY),
        AsyncStorage.getItem(INVITES_STORAGE_KEY),
      ]);

      set({
        members: membersData ? JSON.parse(membersData) : [],
        sharedDocuments: sharesData ? JSON.parse(sharesData) : [],
        pendingInvites: invitesData ? JSON.parse(invitesData) : [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading family data:', error);
      set({ isLoading: false });
    }
  },

  addMember: async (memberData) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAjout: new Date().toISOString(),
    };

    const updatedMembers = [...get().members, newMember];
    await AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(updatedMembers));
    set({ members: updatedMembers });
    
    return newMember;
  },

  updateMember: async (id, updates) => {
    const updatedMembers = get().members.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    await AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(updatedMembers));
    set({ members: updatedMembers });
  },

  removeMember: async (id) => {
    const updatedMembers = get().members.filter((m) => m.id !== id);
    await AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(updatedMembers));
    
    // Also remove from all shared documents
    const updatedShares = get().sharedDocuments.map((share) => ({
      ...share,
      sharedWith: share.sharedWith.filter((memberId) => memberId !== id),
    })).filter((share) => share.sharedWith.length > 0);
    
    await AsyncStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(updatedShares));
    set({ members: updatedMembers, sharedDocuments: updatedShares });
  },

  shareDocument: async (documentId, memberIds, message) => {
    const existingShare = get().sharedDocuments.find((s) => s.documentId === documentId);
    
    let updatedShares: SharedDocument[];
    
    if (existingShare) {
      // Update existing share
      updatedShares = get().sharedDocuments.map((s) =>
        s.documentId === documentId
          ? {
              ...s,
              sharedWith: [...new Set([...s.sharedWith, ...memberIds])],
              message: message || s.message,
            }
          : s
      );
    } else {
      // Create new share
      const newShare: SharedDocument = {
        documentId,
        sharedWith: memberIds,
        sharedAt: new Date().toISOString(),
        message,
        notified: false,
      };
      updatedShares = [...get().sharedDocuments, newShare];
    }

    await AsyncStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(updatedShares));
    set({ sharedDocuments: updatedShares });
  },

  unshareDocument: async (documentId, memberId) => {
    let updatedShares: SharedDocument[];

    if (memberId) {
      // Remove specific member from share
      updatedShares = get().sharedDocuments.map((s) =>
        s.documentId === documentId
          ? { ...s, sharedWith: s.sharedWith.filter((id) => id !== memberId) }
          : s
      ).filter((s) => s.sharedWith.length > 0);
    } else {
      // Remove entire share
      updatedShares = get().sharedDocuments.filter((s) => s.documentId !== documentId);
    }

    await AsyncStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(updatedShares));
    set({ sharedDocuments: updatedShares });
  },

  getDocumentShares: (documentId) => {
    return get().sharedDocuments.find((s) => s.documentId === documentId);
  },

  getMemberSharedDocuments: (memberId) => {
    return get().sharedDocuments.filter((s) => s.sharedWith.includes(memberId));
  },

  generateInviteCode: async (role) => {
    // Generate a 6-character alphanumeric code
    const randomBytes = await Crypto.getRandomBytesAsync(4);
    const code = Array.from(randomBytes)
      .map((b) => b.toString(36).toUpperCase())
      .join('')
      .substring(0, 6);

    const invite: FamilyInvite = {
      code,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      role,
      used: false,
    };

    const updatedInvites = [...get().pendingInvites, invite];
    await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(updatedInvites));
    set({ pendingInvites: updatedInvites });

    return code;
  },

  validateInviteCode: (code) => {
    const invite = get().pendingInvites.find(
      (i) => i.code === code && !i.used && new Date(i.expiresAt) > new Date()
    );
    return invite || null;
  },

  useInviteCode: async (code) => {
    const invite = get().validateInviteCode(code);
    if (!invite) return false;

    const updatedInvites = get().pendingInvites.map((i) =>
      i.code === code ? { ...i, used: true } : i
    );
    await AsyncStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(updatedInvites));
    set({ pendingInvites: updatedInvites });
    
    return true;
  },
}));

// Helper to format member display
export function formatMemberName(member: FamilyMember): string {
  return member.nom ? `${member.prenom} ${member.nom}` : member.prenom;
}

// Helper to get initials
export function getMemberInitials(member: FamilyMember): string {
  const first = member.prenom.charAt(0).toUpperCase();
  const last = member.nom ? member.nom.charAt(0).toUpperCase() : '';
  return first + last;
}
