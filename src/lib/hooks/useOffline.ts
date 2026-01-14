import { useState, useEffect } from 'react';
import { offlineService, OfflineState } from '../services/offline-service';

export function useOffline() {
  const [state, setState] = useState<OfflineState>(offlineService.getState());

  useEffect(() => {
    const unsubscribe = offlineService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    isConnected: state.isConnected,
    isOffline: !state.isConnected,
    pendingActionsCount: state.pendingActionsCount,
    lastSyncDate: state.lastSyncDate,
    lastSyncFormatted: offlineService.formatLastSync(),
    
    // Methods
    checkConnection: () => offlineService.checkConnection(),
    syncPendingActions: () => offlineService.syncPendingActions(),
    addPendingAction: offlineService.addPendingAction.bind(offlineService),
    cacheDocuments: offlineService.cacheDocuments.bind(offlineService),
    getCachedDocuments: offlineService.getCachedDocuments.bind(offlineService),
  };
}
