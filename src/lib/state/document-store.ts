import { create } from 'zustand';
import { Document, User, DocumentCategory } from '../types';

interface DocumentStore {
  documents: Document[];
  user: User;
  selectedCategory: DocumentCategory;
  currentDocument: Document | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setCurrentDocument: (document: Document | null) => void;
  setSelectedCategory: (category: DocumentCategory) => void;
  archiveDocument: (id: number) => void;
}

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 1,
    type: 'Facture',
    organisme: 'Engie',
    titre: 'Facture électricité',
    urgence: 'orange',
    urgenceLabel: 'Cette semaine',
    urgenceIcon: '!',
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
    urgenceIcon: '⚠',
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

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: INITIAL_DOCUMENTS,
  user: {
    name: 'Marie',
    avatar: '👴',
  },
  selectedCategory: 'tous',
  currentDocument: null,

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),

  setCurrentDocument: (document) => set({ currentDocument: document }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  archiveDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),
}));
