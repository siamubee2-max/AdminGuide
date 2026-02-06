export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: number;
          device_id: string;
          type: string;
          organisme: string;
          titre: string;
          urgence: string;
          urgence_label: string;
          urgence_icon: string;
          montant: string | null;
          date_limite: string | null;
          explication: string;
          action: string;
          categorie: string;
          image_uri: string | null;
          date_ajout: string;
          contenu_brut: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          device_id: string;
          type: string;
          organisme: string;
          titre: string;
          urgence: string;
          urgence_label: string;
          urgence_icon: string;
          montant?: string | null;
          date_limite?: string | null;
          explication: string;
          action: string;
          categorie: string;
          image_uri?: string | null;
          date_ajout: string;
          contenu_brut?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          device_id?: string;
          type?: string;
          organisme?: string;
          titre?: string;
          urgence?: string;
          urgence_label?: string;
          urgence_icon?: string;
          montant?: string | null;
          date_limite?: string | null;
          explication?: string;
          action?: string;
          categorie?: string;
          image_uri?: string | null;
          date_ajout?: string;
          contenu_brut?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      history_actions: {
        Row: {
          id: string;
          device_id: string;
          type: string;
          timestamp: number;
          title: string;
          description: string | null;
          document_id: string | null;
          document_title: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          device_id: string;
          type: string;
          timestamp: number;
          title: string;
          description?: string | null;
          document_id?: string | null;
          document_title?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          type?: string;
          timestamp?: number;
          title?: string;
          description?: string | null;
          document_id?: string | null;
          document_title?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          device_id: string;
          prenom: string;
          nom: string | null;
          telephone: string | null;
          email: string | null;
          avatar: string;
          role: string;
          date_ajout: string;
          dernier_acces: string | null;
          notifications_actives: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          device_id: string;
          prenom: string;
          nom?: string | null;
          telephone?: string | null;
          email?: string | null;
          avatar: string;
          role: string;
          date_ajout: string;
          dernier_acces?: string | null;
          notifications_actives?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          prenom?: string;
          nom?: string | null;
          telephone?: string | null;
          email?: string | null;
          avatar?: string;
          role?: string;
          date_ajout?: string;
          dernier_acces?: string | null;
          notifications_actives?: boolean;
          created_at?: string;
        };
      };
      shared_documents: {
        Row: {
          id: number;
          device_id: string;
          document_id: number;
          shared_with: string[];
          shared_at: string;
          message: string | null;
          notified: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          device_id: string;
          document_id: number;
          shared_with: string[];
          shared_at: string;
          message?: string | null;
          notified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          device_id?: string;
          document_id?: number;
          shared_with?: string[];
          shared_at?: string;
          message?: string | null;
          notified?: boolean;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          device_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          device_id: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          device_id?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
