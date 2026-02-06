import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, User, DocumentCategory } from '../types';
import { offlineService } from '../services/offline-service';
import {
  fetchDocuments as fetchDocsRemote,
  upsertDocument,
  deleteDocument as deleteDocRemote,
  syncAllDocuments,
} from '../services/supabase-sync';

const STORAGE_KEY = 'monadmin_documents';

interface DocumentStore {
  documents: Document[];
  user: User;
  selectedCategory: DocumentCategory;
  currentDocument: Document | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadDocuments: () => Promise<void>;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setCurrentDocument: (document: Document | null) => void;
  setSelectedCategory: (category: DocumentCategory) => void;
  archiveDocument: (id: number) => void;
  updateDocument: (id: number, updates: Partial<Document>) => void;
}

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 1,
    type: 'Facture',
    organisme: 'Engie',
    titre: 'Facture électricité',
    urgence: 'orange',
    urgenceLabel: 'Cette semaine',
    urgenceIcon: '⏰',
    montant: '127,50€',
    dateLimite: '15 janvier 2026',
    explication: "C'est votre facture d'électricité pour décembre. Vous devez payer 127,50€ avant le 15 janvier. Vous pouvez payer par virement ou prélèvement automatique.",
    action: 'Payer 127,50€ avant le 15 janvier',
    categorie: 'energie',
    dateAjout: '2026-01-02',
  },
  {
    id: 2,
    type: 'Convocation',
    organisme: 'Mutualité Chrétienne',
    titre: 'Convocation médecin conseil',
    urgence: 'rouge',
    urgenceLabel: 'Urgent',
    urgenceIcon: '⚠️',
    dateLimite: '10 janvier 2026',
    explication: 'Votre mutuelle vous demande de voir leur médecin conseil. C\'est pour vérifier votre dossier de remboursement. Le rendez-vous est obligatoire.',
    action: 'Aller au rendez-vous le 10 janvier à 10h30',
    categorie: 'sante',
    dateAjout: '2026-01-01',
  },
  {
    id: 3,
    type: 'Information',
    organisme: 'Pension Service',
    titre: 'Attestation de pension',
    urgence: 'vert',
    urgenceLabel: 'Pas urgent',
    urgenceIcon: '✓',
    explication: "C'est un document qui confirme le montant de votre pension. Vous n'avez rien à faire, c'est juste pour vos dossiers.",
    action: 'Rien à faire, à conserver',
    categorie: 'pension',
    dateAjout: '2025-12-28',
  },
];

// Helper to save documents to cache
async function saveToCache(documents: Document[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    await offlineService.cacheDocuments(documents);
  } catch (error) {
    console.error('Error saving documents to cache:', error);
  }
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  user: {
    name: 'Marie',
    avatar: '👵',
  },
  selectedCategory: 'tous',
  currentDocument: null,
  isLoading: true,
  isInitialized: false,

  loadDocuments: async () => {
    try {
      set({ isLoading: true });

      // Try Supabase first
      const remoteDocuments = await fetchDocsRemote();
      if (remoteDocuments && remoteDocuments.length > 0) {
        set({ documents: remoteDocuments, isLoading: false, isInitialized: true });
        await saveToCache(remoteDocuments);
        return;
      }

      // Fall back to local cache
      const cached = await AsyncStorage.getItem(STORAGE_KEY);

      if (cached) {
        const documents = JSON.parse(cached) as Document[];
        set({ documents, isLoading: false, isInitialized: true });
        // Sync local docs to Supabase in background
        syncAllDocuments(documents);
      } else {
        // First time - use initial documents
        set({ documents: INITIAL_DOCUMENTS, isLoading: false, isInitialized: true });
        await saveToCache(INITIAL_DOCUMENTS);
        syncAllDocuments(INITIAL_DOCUMENTS);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      // Fallback to initial documents
      set({ documents: INITIAL_DOCUMENTS, isLoading: false, isInitialized: true });
    }
  },

  setDocuments: (documents) => {
    set({ documents });
    saveToCache(documents);
  },

  addDocument: (document) => {
    const newDocuments = [document, ...get().documents];
    set({ documents: newDocuments });
    saveToCache(newDocuments);
    upsertDocument(document);
  },

  setCurrentDocument: (document) => set({ currentDocument: document }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  archiveDocument: async (id) => {
    const newDocuments = get().documents.filter((doc) => doc.id !== id);
    set({ documents: newDocuments });

    // Check if online
    const isOnline = await offlineService.checkConnection();

    if (isOnline) {
      await saveToCache(newDocuments);
      deleteDocRemote(id);
    } else {
      await offlineService.addPendingAction('archive_document', { documentId: id });
      await saveToCache(newDocuments);
    }
  },

  updateDocument: async (id, updates) => {
    const newDocuments = get().documents.map((doc) =>
      doc.id === id ? { ...doc, ...updates } : doc
    );
    set({ documents: newDocuments });

    const isOnline = await offlineService.checkConnection();

    if (isOnline) {
      await saveToCache(newDocuments);
      const updated = newDocuments.find((doc) => doc.id === id);
      if (updated) upsertDocument(updated);
    } else {
      await offlineService.addPendingAction('update_document', { documentId: id, updates });
      await saveToCache(newDocuments);
    }
  },
}));
