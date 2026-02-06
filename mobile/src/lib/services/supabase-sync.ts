/**
 * Supabase Sync Service
 *
 * Provides helper functions to sync local Zustand/AsyncStorage data
 * with Supabase tables. Falls back gracefully to local-only when
 * Supabase is not configured.
 */

import { supabase, isSupabaseEnabled, getDeviceId } from '../supabaseClient';
import type { Document, UrgenceLevel, DocumentCategory } from '../types';
import type { HistoryAction, ActionType } from '../state/history-store';
import type { FamilyMember, SharedDocument, FamilyRole } from '../state/family-store';

// Helper to get a typed reference to a table
function table(name: string) {
  return supabase!.from(name);
}

// ─── Documents ────────────────────────────────────────────────

export async function fetchDocuments(): Promise<Document[] | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await table('documents')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('[Supabase] fetchDocuments error:', error.message);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) ?? []).map(rowToDocument);
  } catch (e) {
    console.log('[Supabase] fetchDocuments exception:', e);
    return null;
  }
}

export async function upsertDocument(doc: Document): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const row = {
      id: doc.id,
      device_id: deviceId,
      type: doc.type,
      organisme: doc.organisme,
      titre: doc.titre,
      urgence: doc.urgence,
      urgence_label: doc.urgenceLabel,
      urgence_icon: doc.urgenceIcon,
      montant: doc.montant ?? null,
      date_limite: doc.dateLimite ?? null,
      explication: doc.explication,
      action: doc.action,
      categorie: doc.categorie,
      image_uri: doc.imageUri ?? null,
      date_ajout: doc.dateAjout,
      contenu_brut: doc.contenuBrut ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('documents').upsert(row as any, { onConflict: 'id' });
    if (error) console.log('[Supabase] upsertDocument error:', error.message);
  } catch (e) {
    console.log('[Supabase] upsertDocument exception:', e);
  }
}

export async function deleteDocument(id: number): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const { error } = await table('documents')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId);
    if (error) console.log('[Supabase] deleteDocument error:', error.message);
  } catch (e) {
    console.log('[Supabase] deleteDocument exception:', e);
  }
}

export async function syncAllDocuments(docs: Document[]): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const rows = docs.map((doc) => ({
      id: doc.id,
      device_id: deviceId,
      type: doc.type,
      organisme: doc.organisme,
      titre: doc.titre,
      urgence: doc.urgence,
      urgence_label: doc.urgenceLabel,
      urgence_icon: doc.urgenceIcon,
      montant: doc.montant ?? null,
      date_limite: doc.dateLimite ?? null,
      explication: doc.explication,
      action: doc.action,
      categorie: doc.categorie,
      image_uri: doc.imageUri ?? null,
      date_ajout: doc.dateAjout,
      contenu_brut: doc.contenuBrut ?? null,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('documents').upsert(rows as any, { onConflict: 'id' });
    if (error) console.log('[Supabase] syncAllDocuments error:', error.message);
  } catch (e) {
    console.log('[Supabase] syncAllDocuments exception:', e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDocument(row: any): Document {
  return {
    id: row.id as number,
    type: row.type as string,
    organisme: row.organisme as string,
    titre: row.titre as string,
    urgence: row.urgence as UrgenceLevel,
    urgenceLabel: row.urgence_label as string,
    urgenceIcon: row.urgence_icon as string,
    montant: (row.montant as string | null) ?? undefined,
    dateLimite: (row.date_limite as string | null) ?? undefined,
    explication: row.explication as string,
    action: row.action as string,
    categorie: row.categorie as DocumentCategory,
    imageUri: (row.image_uri as string | null) ?? undefined,
    dateAjout: row.date_ajout as string,
    contenuBrut: (row.contenu_brut as string | null) ?? undefined,
  };
}

// ─── History ──────────────────────────────────────────────────

export async function fetchHistory(): Promise<HistoryAction[] | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await table('history_actions')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      console.log('[Supabase] fetchHistory error:', error.message);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) ?? []).map(rowToHistoryAction);
  } catch (e) {
    console.log('[Supabase] fetchHistory exception:', e);
    return null;
  }
}

export async function insertHistoryAction(action: HistoryAction): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const row = {
      id: action.id,
      device_id: deviceId,
      type: action.type,
      timestamp: action.timestamp,
      title: action.title,
      description: action.description ?? null,
      document_id: action.documentId ?? null,
      document_title: action.documentTitle ?? null,
      metadata: action.metadata ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('history_actions').insert(row as any);
    if (error) console.log('[Supabase] insertHistoryAction error:', error.message);
  } catch (e) {
    console.log('[Supabase] insertHistoryAction exception:', e);
  }
}

export async function clearHistoryRemote(): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const { error } = await table('history_actions')
      .delete()
      .eq('device_id', deviceId);
    if (error) console.log('[Supabase] clearHistory error:', error.message);
  } catch (e) {
    console.log('[Supabase] clearHistory exception:', e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHistoryAction(row: any): HistoryAction {
  return {
    id: row.id as string,
    type: row.type as ActionType,
    timestamp: row.timestamp as number,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    documentId: (row.document_id as string | null) ?? undefined,
    documentTitle: (row.document_title as string | null) ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

// ─── Family ───────────────────────────────────────────────────

export async function fetchFamilyMembers(): Promise<FamilyMember[] | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await table('family_members')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('[Supabase] fetchFamilyMembers error:', error.message);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) ?? []).map(rowToFamilyMember);
  } catch (e) {
    console.log('[Supabase] fetchFamilyMembers exception:', e);
    return null;
  }
}

export async function upsertFamilyMember(member: FamilyMember): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const row = {
      id: member.id,
      device_id: deviceId,
      prenom: member.prenom,
      nom: member.nom ?? null,
      telephone: member.telephone ?? null,
      email: member.email ?? null,
      avatar: member.avatar,
      role: member.role,
      date_ajout: member.dateAjout,
      dernier_acces: member.dernierAcces ?? null,
      notifications_actives: member.notificationsActives,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('family_members').upsert(row as any, { onConflict: 'id' });
    if (error) console.log('[Supabase] upsertFamilyMember error:', error.message);
  } catch (e) {
    console.log('[Supabase] upsertFamilyMember exception:', e);
  }
}

export async function deleteFamilyMember(id: string): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const { error } = await table('family_members')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId);
    if (error) console.log('[Supabase] deleteFamilyMember error:', error.message);
  } catch (e) {
    console.log('[Supabase] deleteFamilyMember exception:', e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFamilyMember(row: any): FamilyMember {
  return {
    id: row.id as string,
    prenom: row.prenom as string,
    nom: (row.nom as string | null) ?? undefined,
    telephone: (row.telephone as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    avatar: row.avatar as string,
    role: row.role as FamilyRole,
    dateAjout: row.date_ajout as string,
    dernierAcces: (row.dernier_acces as string | null) ?? undefined,
    notificationsActives: row.notifications_actives as boolean,
  };
}

// ─── Shared Documents ─────────────────────────────────────────

export async function fetchSharedDocuments(): Promise<SharedDocument[] | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await table('shared_documents')
      .select('*')
      .eq('device_id', deviceId);

    if (error) {
      console.log('[Supabase] fetchSharedDocuments error:', error.message);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) ?? []).map(rowToSharedDocument);
  } catch (e) {
    console.log('[Supabase] fetchSharedDocuments exception:', e);
    return null;
  }
}

export async function upsertSharedDocument(share: SharedDocument): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    // Delete existing and re-insert since we key by document_id
    await table('shared_documents')
      .delete()
      .eq('document_id', share.documentId)
      .eq('device_id', deviceId);

    const row = {
      device_id: deviceId,
      document_id: share.documentId,
      shared_with: share.sharedWith,
      shared_at: share.sharedAt,
      message: share.message ?? null,
      notified: share.notified,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('shared_documents').insert(row as any);
    if (error) console.log('[Supabase] upsertSharedDocument error:', error.message);
  } catch (e) {
    console.log('[Supabase] upsertSharedDocument exception:', e);
  }
}

export async function deleteSharedDocument(documentId: number): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const { error } = await table('shared_documents')
      .delete()
      .eq('document_id', documentId)
      .eq('device_id', deviceId);
    if (error) console.log('[Supabase] deleteSharedDocument error:', error.message);
  } catch (e) {
    console.log('[Supabase] deleteSharedDocument exception:', e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSharedDocument(row: any): SharedDocument {
  return {
    documentId: row.document_id as number,
    sharedWith: (row.shared_with as string[]) ?? [],
    sharedAt: row.shared_at as string,
    message: (row.message as string | null) ?? undefined,
    notified: row.notified as boolean,
  };
}

// ─── Settings ─────────────────────────────────────────────────

export async function fetchSettings(): Promise<Record<string, unknown> | null> {
  if (!isSupabaseEnabled() || !supabase) return null;
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await table('settings')
      .select('data')
      .eq('device_id', deviceId)
      .single();

    if (error) {
      // PGRST116 = no row found, expected for new devices
      if (error.code !== 'PGRST116') {
        console.log('[Supabase] fetchSettings error:', error.message);
      }
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data as Record<string, unknown>) ?? null;
  } catch (e) {
    console.log('[Supabase] fetchSettings exception:', e);
    return null;
  }
}

export async function saveSettingsRemote(settings: Record<string, unknown>): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const deviceId = await getDeviceId();
    const row = {
      device_id: deviceId,
      data: settings,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await table('settings').upsert(row as any, { onConflict: 'device_id' });
    if (error) console.log('[Supabase] saveSettings error:', error.message);
  } catch (e) {
    console.log('[Supabase] saveSettings exception:', e);
  }
}
