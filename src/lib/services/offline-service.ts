import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Document } from '../types';

const STORAGE_KEYS = {
  DOCUMENTS_CACHE: 'monadmin_documents_cache',
  PENDING_ACTIONS: 'monadmin_pending_actions',
  LAST_SYNC: 'monadmin_last_sync',
};

export type PendingActionType = 
  | 'archive_document'
  | 'add_reminder'
  | 'update_document';

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface OfflineState {
  isConnected: boolean;
  pendingActionsCount: number;
  lastSyncDate: string | null;
}

class OfflineService {
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private currentState: OfflineState = {
    isConnected: true,
    pendingActionsCount: 0,
    lastSyncDate: null,
  };

  constructor() {
    this.initNetworkListener();
    this.loadInitialState();
  }

  private async initNetworkListener() {
    // Subscribe to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.currentState.isConnected;
      this.currentState.isConnected = state.isConnected ?? false;
      this.notifyListeners();

      // If we just came back online, try to sync
      if (wasOffline && this.currentState.isConnected) {
        this.syncPendingActions();
      }
    });
  }

  private async loadInitialState() {
    try {
      const [pendingActionsJson, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      const pendingActions: PendingAction[] = pendingActionsJson 
        ? JSON.parse(pendingActionsJson) 
        : [];

      this.currentState.pendingActionsCount = pendingActions.length;
      this.currentState.lastSyncDate = lastSync;
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading offline state:', error);
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.currentState);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  getState(): OfflineState {
    return this.currentState;
  }

  // Check current network status
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.currentState.isConnected = state.isConnected ?? false;
    this.notifyListeners();
    return this.currentState.isConnected;
  }

  // Cache documents locally
  async cacheDocuments(documents: Document[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOCUMENTS_CACHE,
        JSON.stringify(documents)
      );
      
      // Update last sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      this.currentState.lastSyncDate = now;
      this.notifyListeners();
    } catch (error) {
      console.error('Error caching documents:', error);
    }
  }

  // Get cached documents
  async getCachedDocuments(): Promise<Document[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS_CACHE);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached documents:', error);
      return [];
    }
  }

  // Add a pending action to the queue
  async addPendingAction(
    type: PendingActionType,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      const existingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      const existing: PendingAction[] = existingJson ? JSON.parse(existingJson) : [];

      const newAction: PendingAction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        createdAt: new Date().toISOString(),
      };

      existing.push(newAction);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(existing));
      
      this.currentState.pendingActionsCount = existing.length;
      this.notifyListeners();
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  }

  // Get all pending actions
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  // Remove a pending action after it's been synced
  async removePendingAction(actionId: string): Promise<void> {
    try {
      const existingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      const existing: PendingAction[] = existingJson ? JSON.parse(existingJson) : [];
      
      const filtered = existing.filter(a => a.id !== actionId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
      
      this.currentState.pendingActionsCount = filtered.length;
      this.notifyListeners();
    } catch (error) {
      console.error('Error removing pending action:', error);
    }
  }

  // Clear all pending actions
  async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify([]));
      this.currentState.pendingActionsCount = 0;
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing pending actions:', error);
    }
  }

  // Sync all pending actions when back online
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    const pendingActions = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of pendingActions) {
      try {
        // In a real app, this would call the appropriate API
        // For now, we just simulate success
        console.log(`Syncing action: ${action.type}`, action.payload);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Remove the action after successful sync
        await this.removePendingAction(action.id);
        success++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failed++;
      }
    }

    // Update last sync time
    if (success > 0) {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      this.currentState.lastSyncDate = now;
      this.notifyListeners();
    }

    return { success, failed };
  }

  // Format last sync date for display
  formatLastSync(): string {
    if (!this.currentState.lastSyncDate) {
      return 'Jamais synchronisé';
    }

    const syncDate = new Date(this.currentState.lastSyncDate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  }
}

// Singleton instance
export const offlineService = new OfflineService();
