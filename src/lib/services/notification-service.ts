import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document } from '../types';

const STORAGE_KEY = 'monadmin_scheduled_notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduledReminder {
  id: string;
  notificationId: string;
  documentId: number;
  documentTitle: string;
  scheduledDate: string;
  type: 'j-7' | 'j-3' | 'j-1' | 'j-0' | 'custom';
  status: 'scheduled' | 'delivered' | 'cancelled';
}

class NotificationService {
  private listeners: Set<(reminders: ScheduledReminder[]) => void> = new Set();

  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Rappels',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('urgent', {
        name: 'Urgents',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#EF4444',
        sound: 'default',
      });
    }

    return true;
  }

  // Check if notifications are enabled
  async isEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Schedule a reminder for a document
  async scheduleReminder(
    document: Document,
    reminderDate: Date,
    type: ScheduledReminder['type'] = 'custom'
  ): Promise<string | null> {
    try {
      const hasPermission = await this.isEnabled();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return null;
      }

      // Don't schedule if date is in the past
      if (reminderDate <= new Date()) {
        console.log('Cannot schedule notification in the past');
        return null;
      }

      const isUrgent = document.urgence === 'rouge';
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: isUrgent ? '🔴 Rappel urgent !' : '📅 Rappel MonAdmin',
          body: `${document.titre}\n${document.action}`,
          data: { 
            documentId: document.id,
            type: 'reminder',
          },
          sound: 'default',
          priority: isUrgent 
            ? Notifications.AndroidNotificationPriority.MAX 
            : Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && {
            channelId: isUrgent ? 'urgent' : 'reminders',
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      // Save to storage
      const reminder: ScheduledReminder = {
        id: `${document.id}-${type}-${Date.now()}`,
        notificationId,
        documentId: document.id,
        documentTitle: document.titre,
        scheduledDate: reminderDate.toISOString(),
        type,
        status: 'scheduled',
      };

      await this.saveReminder(reminder);
      this.notifyListeners();

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule automatic reminders based on document deadline
  async scheduleAutomaticReminders(
    document: Document,
    daysBefore: number[] = [7, 3, 1, 0]
  ): Promise<string[]> {
    if (!document.dateLimite) {
      return [];
    }

    const scheduledIds: string[] = [];
    
    // Parse the French date format (e.g., "15 janvier 2026")
    const deadline = this.parseFrenchDate(document.dateLimite);
    if (!deadline) {
      console.log('Could not parse deadline:', document.dateLimite);
      return [];
    }

    const now = new Date();

    for (const days of daysBefore) {
      const reminderDate = new Date(deadline);
      reminderDate.setDate(reminderDate.getDate() - days);
      reminderDate.setHours(9, 0, 0, 0); // 9:00 AM

      // Only schedule if in the future
      if (reminderDate > now) {
        const type = days === 7 ? 'j-7' 
          : days === 3 ? 'j-3' 
          : days === 1 ? 'j-1' 
          : 'j-0';
        
        const id = await this.scheduleReminder(document, reminderDate, type);
        if (id) {
          scheduledIds.push(id);
        }
      }
    }

    return scheduledIds;
  }

  // Parse French date format
  private parseFrenchDate(dateStr: string): Date | null {
    const months: Record<string, number> = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
      'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
      'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
    };

    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return null;

    const [, day, monthStr, year] = match;
    const month = months[monthStr.toLowerCase()];
    
    if (month === undefined) return null;

    return new Date(parseInt(year), month, parseInt(day));
  }

  // Cancel a specific reminder
  async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.updateReminderStatus(notificationId, 'cancelled');
      this.notifyListeners();
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel all reminders for a document
  async cancelDocumentReminders(documentId: number): Promise<void> {
    const reminders = await this.getScheduledReminders();
    const documentReminders = reminders.filter(r => r.documentId === documentId);

    for (const reminder of documentReminders) {
      await this.cancelReminder(reminder.notificationId);
    }
  }

  // Get all scheduled reminders
  async getScheduledReminders(): Promise<ScheduledReminder[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const reminders: ScheduledReminder[] = json ? JSON.parse(json) : [];
      
      // Filter out past reminders
      const now = new Date();
      return reminders.filter(r => 
        r.status === 'scheduled' && new Date(r.scheduledDate) > now
      );
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  // Get reminders for a specific document
  async getDocumentReminders(documentId: number): Promise<ScheduledReminder[]> {
    const reminders = await this.getScheduledReminders();
    return reminders.filter(r => r.documentId === documentId);
  }

  // Save reminder to storage
  private async saveReminder(reminder: ScheduledReminder): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const reminders: ScheduledReminder[] = json ? JSON.parse(json) : [];
      reminders.push(reminder);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  }

  // Update reminder status
  private async updateReminderStatus(
    notificationId: string,
    status: ScheduledReminder['status']
  ): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const reminders: ScheduledReminder[] = json ? JSON.parse(json) : [];
      
      const updated = reminders.map(r =>
        r.notificationId === notificationId ? { ...r, status } : r
      );
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating reminder status:', error);
    }
  }

  // Send immediate notification
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Subscribe to reminder changes
  subscribe(listener: (reminders: ScheduledReminder[]) => void): () => void {
    this.listeners.add(listener);
    this.getScheduledReminders().then(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const reminders = await this.getScheduledReminders();
    this.listeners.forEach(listener => listener(reminders));
  }

  // Setup notification response handler
  setupResponseHandler(
    onNotificationResponse: (documentId: number) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        if (data?.documentId) {
          onNotificationResponse(data.documentId as number);
        }
      }
    );

    return () => subscription.remove();
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }
}

// Singleton instance
export const notificationService = new NotificationService();
