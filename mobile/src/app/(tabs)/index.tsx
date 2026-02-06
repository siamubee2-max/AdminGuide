import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Mic, FolderOpen, Phone, ChevronRight, Sparkles, Settings, BarChart3, Clock, Users, Lock } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';
import { useSettingsStore } from '@/lib/state/settings-store';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { OfflineBanner } from '@/components/OfflineBanner';
import { usePremium } from '@/lib/hooks/usePremium';
import { useTranslation } from '@/lib/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const t = useTranslation();
  const userPrenom = useSettingsStore((s) => s.profile.prenom);
  const userAvatar = useSettingsStore((s) => s.profile.avatar);
  const documents = useDocumentStore((s) => s.documents);
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);
  const isInitialized = useDocumentStore((s) => s.isInitialized);
  
  // Display settings
  const display = useDisplaySettings();
  const { isPremium, requirePremium } = usePremium();

  // Load documents on mount
  React.useEffect(() => {
    if (!isInitialized) {
      loadDocuments();
    }
  }, [isInitialized]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('home.greeting_morning'), emoji: '☀️' };
    if (hour < 18) return { text: t('home.greeting_afternoon'), emoji: '🌤️' };
    return { text: t('home.greeting_evening'), emoji: '🌙' };
  }, [t]);

  const urgentCount = documents.filter((d) => d.urgence === 'rouge').length;
  const pendingCount = documents.length;

  // Animation pour le bouton principal
  const pulseValue = useSharedValue(1);
  React.useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      {/* Background gradient subtil */}
      <LinearGradient
        colors={display.isDarkMode 
          ? ['#1F2937', '#111827', '#0F172A'] 
          : ['#FEF7ED', '#FFFBF5', '#FFFFFF']}
        locations={[0, 0.3, 0.6]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec salutation chaleureuse */}
          <Animated.View
            entering={FadeInDown.duration(700).delay(100).springify()}
            className="px-6 pt-6 pb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 32 }}>{greeting.emoji}</Text>
                  <Text
                    className="ml-2"
                    style={{ 
                      fontFamily: 'Nunito_800ExtraBold',
                      fontSize: display.fontSize['3xl'],
                      color: display.colors.text,
                    }}
                  >
                    {greeting.text}
                  </Text>
                </View>
                <Text
                  className="mt-1"
                  style={{ 
                    fontFamily: 'Nunito_800ExtraBold',
                    fontSize: display.fontSize['4xl'],
                    color: display.colors.primary,
                  }}
                >
                  {userPrenom} !
                </Text>
              </View>
              
              {/* Avatar avec cercle décoratif */}
              <View className="items-center">
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#DBEAFE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: '#2563EB',
                  }}
                >
                  <Text style={{ fontSize: 44 }}>{userAvatar}</Text>
                </View>
              </View>
            </View>
            
            <Text
              className="mt-3"
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.xl,
                color: display.colors.textSecondary,
              }}
            >
              {t('home.subtitle')}
            </Text>
          </Animated.View>

          {/* Bannière hors-ligne */}
          <OfflineBanner showSyncStatus={false} />

          {/* Bannière d'alerte améliorée avec accès tableau de bord */}
          {pendingCount > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(200).springify()}
              className="mx-6 mb-4"
            >
              <Pressable
                onPress={() => router.push('/dashboard')}
                className="overflow-hidden rounded-3xl active:opacity-90"
              >
                <LinearGradient
                  colors={urgentCount > 0 ? ['#FEF3C7', '#FDE68A'] : ['#DBEAFE', '#BFDBFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: urgentCount > 0 ? '#F59E0B' : '#60A5FA',
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: urgentCount > 0 ? '#FEF3C7' : '#EFF6FF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: urgentCount > 0 ? '#F59E0B' : '#3B82F6',
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>{urgentCount > 0 ? '⚡' : '📬'}</Text>
                    </View>
                    <View className="ml-4 flex-1">
                      <Text
                        className="text-lg"
                        style={{
                          fontFamily: 'Nunito_700Bold',
                          color: urgentCount > 0 ? '#B45309' : '#1E40AF',
                        }}
                      >
                        {t('home.mail_count', { count: pendingCount, s: pendingCount > 1 ? 's' : '' })}
                      </Text>
                      {urgentCount > 0 && (
                        <Text
                          className="text-base mt-0.5"
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            color: '#DC2626',
                          }}
                        >
                          {t('home.urgent_count', { count: urgentCount, s: urgentCount > 1 ? 's' : '' })}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={24} color={urgentCount > 0 ? '#B45309' : '#1E40AF'} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Bouton tableau de bord */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(250).springify()}
            className="mx-6 mb-6"
          >
            <Pressable
              onPress={() => router.push('/dashboard')}
              className="rounded-2xl p-4 flex-row items-center active:scale-[0.98]"
              style={{
                backgroundColor: '#EEF2FF',
                borderWidth: 2,
                borderColor: '#C7D2FE',
              }}
            >
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: '#DDD6FE' }}
              >
                <BarChart3 size={24} color="#4F46E5" strokeWidth={2} />
              </View>
              <View className="ml-4 flex-1">
                <Text
                  className="text-lg"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#4338CA' }}
                >
                  {t('home.dashboard')}
                </Text>
                <Text
                  className="text-sm"
                  style={{ fontFamily: 'Nunito_400Regular', color: '#6366F1' }}
                >
                  {t('home.dashboard_sub')}
                </Text>
              </View>
              <ChevronRight size={20} color="#6366F1" />
            </Pressable>
          </Animated.View>

          {/* Bouton principal - Scanner */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(300).springify()}
            className="px-6 mb-5"
            style={pulseStyle}
          >
            <Pressable
              onPress={() => {
                if (!isPremium) {
                  requirePremium();
                } else {
                  router.push('/(tabs)/scanner');
                }
              }}
              className="overflow-hidden rounded-3xl active:scale-[0.98]"
              style={{
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, borderRadius: 24 }}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Camera size={32} color="white" strokeWidth={2.5} />
                  </View>
                  <View className="ml-5 flex-1">
                    <Text
                      className="text-2xl text-white"
                      style={{ fontFamily: 'Nunito_800ExtraBold' }}
                    >
                      {t('home.scan')}
                    </Text>
                    <Text
                      className="text-base text-white/80 mt-1"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {t('home.scan_sub')}
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    {isPremium ? (
                      <Sparkles size={20} color="white" />
                    ) : (
                      <Lock size={20} color="white" />
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Grille d'actions secondaires */}
          <View className="px-6 flex-row space-x-4 mb-5">
            {/* Parler */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(400).springify()}
              className="flex-1"
            >
              <Pressable
                onPress={() => {
                  if (!isPremium) {
                    requirePremium();
                  } else {
                    router.push('/vocal');
                  }
                }}
                className="rounded-3xl p-5 active:scale-[0.98]"
                style={{
                  backgroundColor: '#FEF7ED',
                  borderWidth: 2,
                  borderColor: '#FDBA74',
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                    style={{ backgroundColor: '#FED7AA' }}
                  >
                    <Mic size={28} color="#EA580C" strokeWidth={2} />
                  </View>
                  {!isPremium && <Lock size={16} color="#C2410C" />}
                </View>
                <Text
                  className="text-lg"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#C2410C' }}
                >
                  {t('home.speak')}
                </Text>
                <Text
                  className="text-sm text-text-secondary mt-0.5"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {t('home.speak_sub')}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Documents */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(500).springify()}
              className="flex-1"
            >
              <Pressable
                onPress={() => router.push('/(tabs)/documents')}
                className="rounded-3xl p-5 active:scale-[0.98]"
                style={{
                  backgroundColor: '#F5F3FF',
                  borderWidth: 2,
                  borderColor: '#C4B5FD',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                  style={{ backgroundColor: '#DDD6FE' }}
                >
                  <FolderOpen size={28} color="#6D28D9" strokeWidth={2} />
                </View>
                <Text
                  className="text-lg"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#5B21B6' }}
                >
                  {t('home.documents')}
                </Text>
                <Text
                  className="text-sm text-text-secondary mt-0.5"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {t('home.documents_sub')}
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Bouton Ma Famille */}
          <Animated.View 
            entering={FadeInUp.duration(500).delay(600).springify()}
            className="px-6 mb-6"
          >
            <Pressable
              onPress={() => router.push('/famille')}
              className="rounded-3xl overflow-hidden active:scale-[0.98]"
              style={{
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, borderRadius: 24 }}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Users size={28} color="white" strokeWidth={2} />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="text-xl text-white"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {t('home.family')}
                    </Text>
                    <Text
                      className="text-sm text-white/80 mt-0.5"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {t('home.family_sub')}
                    </Text>
                  </View>
                  <ChevronRight size={24} color="white" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Section conseils du jour */}
          <Animated.View
            entering={FadeIn.duration(500).delay(700)}
            className="mx-6 mt-2"
          >
            <View 
              className="rounded-3xl p-5"
              style={{ 
                backgroundColor: '#FDF2F8',
                borderWidth: 2,
                borderColor: '#FBCFE8',
              }}
            >
              <View className="flex-row items-center mb-3">
                <Text style={{ fontSize: 24 }}>💡</Text>
                <Text
                  className="text-lg ml-2"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#BE185D' }}
                >
                  {t('home.tip_title')}
                </Text>
              </View>
              <Text
                className="text-base leading-6"
                style={{ fontFamily: 'Nunito_400Regular', color: '#831843' }}
              >
                {t('home.tip_text')}
              </Text>
            </View>
          </Animated.View>

          {/* Boutons bas (Historique + Réglages) */}
          <Animated.View
            entering={FadeIn.duration(500).delay(800)}
            className="mx-6 mt-5 flex-row space-x-3"
          >
            {/* Historique */}
            <Pressable
              onPress={() => router.push('/historique')}
              className="flex-1 rounded-2xl p-4 flex-row items-center active:scale-[0.98]"
              style={{
                backgroundColor: display.colors.card,
                borderWidth: 1,
                borderColor: display.colors.border,
              }}
            >
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: display.isDarkMode ? '#312E81' : '#F5F3FF' }}
              >
                <Clock size={20} color="#7C3AED" />
              </View>
              <Text
                className="ml-3"
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: display.fontSize.base,
                  color: display.colors.textSecondary,
                }}
              >
                {t('home.history')}
              </Text>
            </Pressable>

            {/* Réglages */}
            <Pressable
              onPress={() => router.push('/reglages')}
              className="flex-1 rounded-2xl p-4 flex-row items-center active:scale-[0.98]"
              style={{
                backgroundColor: display.colors.card,
                borderWidth: 1,
                borderColor: display.colors.border,
              }}
            >
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: display.isDarkMode ? '#1F2937' : '#F3F4F6' }}
              >
                <Settings size={20} color={display.isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
              <Text
                className="ml-3"
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: display.fontSize.base,
                  color: display.colors.textSecondary,
                }}
              >
                {t('home.settings')}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
