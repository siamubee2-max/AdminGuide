import { useState, useEffect, useCallback } from 'react';
import { notificationService, ScheduledReminder } from '../services/notification-service';
import { Document } from '../types';

export function useNotifications() {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Check permission status
    notificationService.isEnabled().then(setIsEnabled);

    // Subscribe to reminder changes
    const unsubscribe = notificationService.subscribe(setReminders);
    return unsubscribe;
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setIsEnabled(granted);
    return granted;
  }, []);

  const scheduleReminder = useCallback(async (
    document: Document,
    date: Date,
    type?: ScheduledReminder['type']
  ) => {
    return notificationService.scheduleReminder(document, date, type);
  }, []);

  const scheduleAutomaticReminders = useCallback(async (
    document: Document,
    daysBefore?: number[]
  ) => {
    return notificationService.scheduleAutomaticReminders(document, daysBefore);
  }, []);

  const cancelReminder = useCallback(async (notificationId: string) => {
    return notificationService.cancelReminder(notificationId);
  }, []);

  const cancelDocumentReminders = useCallback(async (documentId: number) => {
    return notificationService.cancelDocumentReminders(documentId);
  }, []);

  const getDocumentReminders = useCallback(async (documentId: number) => {
    return notificationService.getDocumentReminders(documentId);
  }, []);

  return {
    reminders,
    isEnabled,
    requestPermission,
    scheduleReminder,
    scheduleAutomaticReminders,
    cancelReminder,
    cancelDocumentReminders,
    getDocumentReminders,
  };
}
