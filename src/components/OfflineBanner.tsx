import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useOffline } from '@/lib/hooks/useOffline';

interface OfflineBannerProps {
  showSyncStatus?: boolean;
}

export function OfflineBanner({ showSyncStatus = true }: OfflineBannerProps) {
  const { 
    isOffline, 
    pendingActionsCount, 
    lastSyncFormatted,
    syncPendingActions,
    isConnected,
  } = useOffline();

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{ success: number; failed: number } | null>(null);

  const rotateValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (isOffline) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isOffline]);

  useEffect(() => {
    if (isSyncing) {
      rotateValue.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotateValue.value = 0;
    }
  }, [isSyncing]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const handleSync = async () => {
    if (isSyncing || isOffline) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncPendingActions();
      setSyncResult(result);
      
      if (result.success > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Clear result after 3 seconds
      setTimeout(() => setSyncResult(null), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show anything if online and no pending actions
  if (isConnected && pendingActionsCount === 0 && !showSyncStatus) {
    return null;
  }

  // Offline banner
  if (isOffline) {
    return (
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutUp.duration(300)}
        style={pulseStyle}
      >
        <View
          className="mx-4 mt-2 rounded-2xl p-4 flex-row items-center"
          style={{
            backgroundColor: '#FEF3C7',
            borderWidth: 2,
            borderColor: '#F59E0B',
          }}
        >
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: '#FDE68A' }}
          >
            <WifiOff size={24} color="#B45309" />
          </View>
          <View className="flex-1 ml-4">
            <Text
              className="text-lg"
              style={{ fontFamily: 'Nunito_700Bold', color: '#92400E' }}
            >
              Mode hors-ligne
            </Text>
            <Text
              className="text-sm"
              style={{ fontFamily: 'Nunito_400Regular', color: '#B45309' }}
            >
              {pendingActionsCount > 0 
                ? `${pendingActionsCount} action${pendingActionsCount > 1 ? 's' : ''} en attente`
                : 'Vos documents sont disponibles'}
            </Text>
          </View>
          <CloudOff size={20} color="#D97706" />
        </View>
      </Animated.View>
    );
  }

  // Pending actions banner (when online)
  if (pendingActionsCount > 0 || syncResult) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
      >
        <Pressable
          onPress={handleSync}
          disabled={isSyncing}
          className="mx-4 mt-2 rounded-2xl p-4 flex-row items-center active:opacity-90"
          style={{
            backgroundColor: syncResult 
              ? (syncResult.failed > 0 ? '#FEE2E2' : '#D1FAE5')
              : '#EFF6FF',
            borderWidth: 2,
            borderColor: syncResult
              ? (syncResult.failed > 0 ? '#EF4444' : '#10B981')
              : '#3B82F6',
          }}
        >
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ 
              backgroundColor: syncResult
                ? (syncResult.failed > 0 ? '#FECACA' : '#A7F3D0')
                : '#DBEAFE'
            }}
          >
            {syncResult ? (
              syncResult.failed > 0 ? (
                <CloudOff size={24} color="#DC2626" />
              ) : (
                <Check size={24} color="#059669" />
              )
            ) : (
              <Animated.View style={isSyncing ? rotateStyle : undefined}>
                <RefreshCw size={24} color="#2563EB" />
              </Animated.View>
            )}
          </View>
          <View className="flex-1 ml-4">
            <Text
              className="text-lg"
              style={{ 
                fontFamily: 'Nunito_700Bold', 
                color: syncResult
                  ? (syncResult.failed > 0 ? '#991B1B' : '#047857')
                  : '#1E40AF'
              }}
            >
              {syncResult
                ? (syncResult.failed > 0 
                    ? 'Erreur de synchronisation' 
                    : 'Synchronisé !')
                : (isSyncing ? 'Synchronisation...' : 'Actions en attente')}
            </Text>
            <Text
              className="text-sm"
              style={{ 
                fontFamily: 'Nunito_400Regular', 
                color: syncResult
                  ? (syncResult.failed > 0 ? '#DC2626' : '#059669')
                  : '#3B82F6'
              }}
            >
              {syncResult
                ? `${syncResult.success} synchronisé${syncResult.success > 1 ? 's' : ''}`
                : `${pendingActionsCount} action${pendingActionsCount > 1 ? 's' : ''} • Appuyez pour sync`}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Sync status (optional)
  if (showSyncStatus) {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <View className="mx-4 mt-2 flex-row items-center justify-center py-2">
          <Check size={14} color="#10B981" />
          <Text
            className="text-sm ml-2"
            style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
          >
            Synchronisé {lastSyncFormatted.toLowerCase()}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return null;
}
