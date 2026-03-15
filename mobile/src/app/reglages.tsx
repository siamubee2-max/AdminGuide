import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Eye,
  Volume2,
  Bell,
  Users,
  Info,
  Check,
  Crown,
  Building2,
  Shield,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import {
  useSettingsStore,
  SettingsStore,
  FontSize,
  VoiceSpeed,
} from '@/lib/state/settings-store';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { hasEntitlement } from '@/lib/revenuecatClient';
import { useTranslation, LANGUAGES } from '@/lib/i18n';
import { ProfilSection, FamilleSection, ToggleRow } from '@/components/settings';

type Section = 'main' | 'profil' | 'affichage' | 'son' | 'notifications' | 'famille' | 'apropos';

export default function ReglagesScreen() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section>('main');
  const t = useTranslation();

  const settings = useSettingsStore((s) => s);
  const display = useDisplaySettings();
  
  const navigateToSection = (section: Section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSection(section);
  };

  const goBack = () => {
    if (currentSection === 'main') {
      router.back();
    } else {
      setCurrentSection('main');
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'profil': return t('settings.profile');
      case 'affichage': return t('settings.display');
      case 'son': return t('settings.sound');
      case 'notifications': return t('settings.notifications');
      case 'famille': return t('settings.family');
      case 'apropos': return t('settings.about');
      default: return t('settings.title');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode 
          ? ['#1F2937', '#111827', '#0F172A']
          : ['#F5F3FF', '#FFFBF5', '#FFFFFF']}
        locations={[0, 0.2, 0.5]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4 flex-row items-center"
        >
          <Pressable
            onPress={goBack}
            className="flex-row items-center active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF' }}
            >
              <ChevronLeft size={24} color={display.colors.primary} />
            </View>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: display.colors.primary,
              }}
            >
              {currentSection === 'main' ? t('settings.back') : t('settings.title')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-6 pb-6"
        >
          <View className="flex-row items-center">
            <Text style={{ fontSize: 32 }}>⚙️</Text>
            <Text
              className="ml-3"
              style={{ 
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: display.fontSize['3xl'],
                color: display.colors.text,
              }}
            >
              {getSectionTitle()}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {currentSection === 'main' && (
            <MainSection onNavigate={navigateToSection} display={display} />
          )}
          {currentSection === 'profil' && (
            <ProfilSection settings={settings} />
          )}
          {currentSection === 'affichage' && (
            <AffichageSection settings={settings} />
          )}
          {currentSection === 'son' && (
            <SonSection settings={settings} />
          )}
          {currentSection === 'notifications' && (
            <NotificationsSection settings={settings} />
          )}
          {currentSection === 'famille' && (
            <FamilleSection settings={settings} />
          )}
          {currentSection === 'apropos' && (
            <AProposSection />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Section principale avec liste des catégories
function MainSection({ onNavigate, display }: { onNavigate: (section: Section) => void; display: ReturnType<typeof useDisplaySettings> }) {
  const router = useRouter();
  const t = useTranslation();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const currentLanguage = useSettingsStore((s) => s.language);

  const { data: isPremium } = useQuery({
    queryKey: ['premium-status'],
    queryFn: async () => {
      const result = await hasEntitlement('premium');
      return result.ok ? result.data : false;
    },
  });

  const menuItems = [
    { id: 'profil' as Section, icon: User, label: t('settings.profile'), emoji: '👤', color: '#2563EB', bg: '#DBEAFE', bgDark: '#1E3A5F' },
    { id: 'affichage' as Section, icon: Eye, label: t('settings.display'), emoji: '👁️', color: '#7C3AED', bg: '#F5F3FF', bgDark: '#312E81' },
    { id: 'son' as Section, icon: Volume2, label: t('settings.sound'), emoji: '🔊', color: '#F59E0B', bg: '#FEF3C7', bgDark: '#78350F' },
    { id: 'notifications' as Section, icon: Bell, label: t('settings.notifications'), emoji: '🔔', color: '#EF4444', bg: '#FEE2E2', bgDark: '#7F1D1D' },
    { id: 'famille' as Section, icon: Users, label: t('settings.family'), emoji: '👨‍👩‍👧', color: '#10B981', bg: '#D1FAE5', bgDark: '#064E3B' },
    { id: 'apropos' as Section, icon: Info, label: t('settings.about'), emoji: 'ℹ️', color: '#6B7280', bg: '#F3F4F6', bgDark: '#374151' },
  ];

  return (
    <View className="space-y-3">
      {/* Premium Banner */}
      <Animated.View entering={FadeInUp.duration(400)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/premium');
          }}
          className="rounded-2xl p-5 flex-row items-center active:scale-[0.98] overflow-hidden"
          style={{ backgroundColor: isPremium ? '#FEF3C7' : '#1E3A8A' }}
        >
          <LinearGradient
            colors={isPremium ? ['#FEF3C7', '#FDE68A'] : ['#1E3A8A', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: isPremium ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
          >
            <Crown size={28} color={isPremium ? 'white' : '#FCD34D'} />
          </View>
          <View className="flex-1 ml-4">
            <Text
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: isPremium ? '#92400E' : 'white',
              }}
            >
              {isPremium ? t('settings.is_premium') : t('settings.go_premium')}
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.sm,
                color: isPremium ? '#B45309' : '#BFDBFE',
                marginTop: 2,
              }}
            >
              {isPremium ? t('settings.premium_unlocked') : t('settings.premium_price')}
            </Text>
          </View>
          <ChevronRight size={24} color={isPremium ? '#92400E' : 'white'} />
        </Pressable>
      </Animated.View>

      {/* MonAdmin Pro B2B Banner */}
      <Animated.View entering={FadeInUp.duration(400).delay(40)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/pro-b2b');
          }}
          className="rounded-2xl p-4 flex-row items-center active:scale-[0.98] overflow-hidden"
          style={{
            backgroundColor: display.isDarkMode ? '#1E3A5F' : '#F0FDF4',
            borderWidth: 1,
            borderColor: display.isDarkMode ? '#065F46' : '#BBF7D0',
          }}
        >
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: display.isDarkMode ? '#064E3B' : '#D1FAE5' }}
          >
            <Building2 size={24} color="#059669" />
          </View>
          <View className="flex-1 ml-3">
            <Text
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.base,
                color: display.isDarkMode ? '#34D399' : '#047857',
              }}
            >
              MonAdmin Pro
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.xs,
                color: display.isDarkMode ? '#6EE7B7' : '#059669',
              }}
            >
              Pour EHPAD et résidences seniors
            </Text>
          </View>
          <ChevronRight size={20} color="#059669" />
        </Pressable>
      </Animated.View>

      {/* Trust & Security Banner */}
      <Animated.View entering={FadeInUp.duration(400).delay(60)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/confiance');
          }}
          className="rounded-2xl p-4 flex-row items-center active:scale-[0.98] overflow-hidden"
          style={{
            backgroundColor: display.isDarkMode ? '#1E293B' : '#F0F9FF',
            borderWidth: 1,
            borderColor: display.isDarkMode ? '#1E3A5F' : '#BAE6FD',
          }}
        >
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#DBEAFE' }}
          >
            <Shield size={24} color="#2563EB" />
          </View>
          <View className="flex-1 ml-3">
            <Text
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.base,
                color: display.isDarkMode ? '#93C5FD' : '#1E40AF',
              }}
            >
              Confiance & Sécurité
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.xs,
                color: display.isDarkMode ? '#60A5FA' : '#2563EB',
              }}
            >
              Vos données sont protégées
            </Text>
          </View>
          <ChevronRight size={20} color="#2563EB" />
        </Pressable>
      </Animated.View>

      {/* Language Selector */}
      <Animated.View entering={FadeInUp.duration(400).delay(80)}>
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: display.colors.card }}
        >
          <Text
            className="mb-3"
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: display.fontSize.lg,
              color: display.colors.text,
            }}
          >
            {t('settings.language')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage(lang.code);
                }}
                className="px-4 py-3 rounded-xl flex-row items-center"
                style={{
                  backgroundColor: currentLanguage === lang.code
                    ? (display.isDarkMode ? '#1E3A5F' : '#DBEAFE')
                    : (display.isDarkMode ? '#1F2937' : '#F9FAFB'),
                  borderWidth: currentLanguage === lang.code ? 2 : 0,
                  borderColor: '#2563EB',
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>{lang.flag}</Text>
                <Text
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: display.fontSize.sm,
                    color: currentLanguage === lang.code ? display.colors.primary : display.colors.text,
                  }}
                >
                  {lang.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Menu Items */}
      {menuItems.map((item, index) => (
        <Animated.View key={item.id} entering={FadeInUp.duration(400).delay(100 + index * 50)}>
          <Pressable
            onPress={() => onNavigate(item.id)}
            className="rounded-2xl p-5 flex-row items-center active:scale-[0.98]"
            style={{ backgroundColor: display.colors.card }}
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: display.isDarkMode ? item.bgDark : item.bg }}
            >
              <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            </View>
            <Text
              className="flex-1 ml-4"
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              {item.label}
            </Text>
            <ChevronRight size={24} color={display.colors.textMuted} />
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

// Section Affichage
function AffichageSection({ settings }: { settings: SettingsStore }) {
  const t = useTranslation();
  const display = useDisplaySettings();

  const fontSizes: { id: FontSize; label: string; sampleSize: number }[] = [
    { id: 'normal', label: t('settings.font_normal'), sampleSize: 16 },
    { id: 'grand', label: t('settings.font_large'), sampleSize: 19 },
    { id: 'tres_grand', label: t('settings.font_xlarge'), sampleSize: 22 },
  ];

  const getPreviewColors = () => {
    if (settings.modeSombre) {
      return settings.contrasteEleve 
        ? { bg: '#000000', text: '#FFFFFF', card: '#111827' }
        : { bg: '#111827', text: '#F9FAFB', card: '#1F2937' };
    }
    return settings.contrasteEleve
      ? { bg: '#FFFFFF', text: '#000000', card: '#FFFFFF' }
      : { bg: '#FFFBF5', text: '#1F2937', card: '#FFFFFF' };
  };

  const previewColors = getPreviewColors();

  return (
    <View className="space-y-5">
      {/* Aperçu en direct */}
      <View 
        className="rounded-2xl p-5 overflow-hidden"
        style={{ 
          backgroundColor: previewColors.bg,
          borderWidth: 2,
          borderColor: settings.contrasteEleve ? previewColors.text : '#E5E7EB',
        }}
      >
        <Text
          className="text-sm mb-2"
          style={{ fontFamily: 'Nunito_600SemiBold', color: settings.modeSombre ? '#9CA3AF' : '#6B7280' }}
        >
          {t('settings.preview')}
        </Text>
        <View className="rounded-xl p-4" style={{ backgroundColor: previewColors.card }}>
          <Text
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16,
              color: previewColors.text,
              marginBottom: 8,
            }}
          >
            {t('settings.preview_example')}
          </Text>
          <Text
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: (fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16) - 2,
              color: settings.modeSombre ? '#D1D5DB' : '#6B7280',
              lineHeight: (fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16) * 1.5,
            }}
          >
            {t('settings.preview_msg')}
          </Text>
        </View>
      </View>

      {/* Taille du texte */}
      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <Text
          className="mb-4"
          style={{ fontFamily: 'Nunito_700Bold', fontSize: display.fontSize.lg, color: display.colors.text }}
        >
          {t('settings.font_size')}
        </Text>
        <View className="space-y-3">
          {fontSizes.map((size) => (
            <Pressable
              key={size.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                settings.setTaillePolice(size.id);
              }}
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: settings.taillePolice === size.id ? '#DBEAFE' : '#F9FAFB',
                borderWidth: settings.taillePolice === size.id ? 2 : 0,
                borderColor: '#2563EB',
              }}
            >
              <View className="flex-row items-center">
                <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: size.sampleSize, color: settings.taillePolice === size.id ? '#1E40AF' : '#374151' }}>
                  Aa
                </Text>
                <Text className="ml-4" style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: settings.taillePolice === size.id ? '#1E40AF' : '#374151' }}>
                  {size.label}
                </Text>
              </View>
              {settings.taillePolice === size.id && <Check size={24} color="#2563EB" />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Mode sombre */}
      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <Text className="mb-4" style={{ fontFamily: 'Nunito_700Bold', fontSize: display.fontSize.lg, color: display.colors.text }}>
          {t('settings.theme')}
        </Text>
        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (settings.modeSombre) settings.toggleModeSombre(); }}
            className="flex-1 rounded-xl p-4 items-center"
            style={{ backgroundColor: !settings.modeSombre ? '#FEF3C7' : '#F9FAFB', borderWidth: !settings.modeSombre ? 2 : 0, borderColor: '#F59E0B' }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>☀️</Text>
            <Text style={{ fontFamily: 'Nunito_600SemiBold', color: !settings.modeSombre ? '#B45309' : '#6B7280' }}>{t('settings.theme_light')}</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!settings.modeSombre) settings.toggleModeSombre(); }}
            className="flex-1 rounded-xl p-4 items-center"
            style={{ backgroundColor: settings.modeSombre ? '#312E81' : '#F9FAFB', borderWidth: settings.modeSombre ? 2 : 0, borderColor: '#4F46E5' }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🌙</Text>
            <Text style={{ fontFamily: 'Nunito_600SemiBold', color: settings.modeSombre ? '#E0E7FF' : '#6B7280' }}>{t('settings.theme_dark')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Contraste élevé */}
      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <ToggleRow
          label={t('settings.contrast')}
          description={t('settings.contrast_desc')}
          value={settings.contrasteEleve}
          onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); settings.toggleContrasteEleve(); }}
        />
      </View>

      {/* Info */}
      <View className="rounded-2xl p-4" style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
        <View className="flex-row items-start">
          <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
          <Text className="flex-1 text-sm" style={{ fontFamily: 'Nunito_400Regular', color: '#1E40AF', lineHeight: 20 }}>
            {t('settings.changes_live')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Section Son
function SonSection({ settings }: { settings: SettingsStore }) {
  const t = useTranslation();
  const display = useDisplaySettings();

  const voiceSpeeds: { id: VoiceSpeed; label: string }[] = [
    { id: 'lent', label: t('settings.speed_slow') },
    { id: 'normal', label: t('settings.speed_normal') },
    { id: 'rapide', label: t('settings.speed_fast') },
  ];

  return (
    <View className="space-y-5">
      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <Text className="mb-2" style={{ fontFamily: 'Nunito_700Bold', fontSize: display.fontSize.lg, color: display.colors.text }}>
          {t('settings.volume')}
        </Text>
        <Text className="text-base text-text-secondary mb-4" style={{ fontFamily: 'Nunito_400Regular' }}>
          {settings.volumeVocal}%
        </Text>
        <View className="flex-row items-center space-x-4">
          <Text style={{ fontSize: 20 }}>🔈</Text>
          <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full rounded-full" style={{ width: `${settings.volumeVocal}%`, backgroundColor: '#2563EB' }} />
          </View>
          <Text style={{ fontSize: 20 }}>🔊</Text>
        </View>
        <View className="flex-row justify-between mt-4">
          {[0, 25, 50, 75, 100].map((vol) => (
            <Pressable
              key={vol}
              onPress={() => settings.setVolumeVocal(vol)}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: settings.volumeVocal === vol ? '#DBEAFE' : '#F3F4F6' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: settings.volumeVocal === vol ? '#1E40AF' : '#6B7280' }}>
                {vol}%
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <Text className="mb-4" style={{ fontFamily: 'Nunito_700Bold', fontSize: display.fontSize.lg, color: display.colors.text }}>
          {t('settings.speed')}
        </Text>
        <View className="flex-row space-x-3">
          {voiceSpeeds.map((speed) => (
            <Pressable
              key={speed.id}
              onPress={() => settings.setVitesseVocale(speed.id)}
              className="flex-1 py-4 rounded-xl items-center"
              style={{
                backgroundColor: settings.vitesseVocale === speed.id ? '#FEF3C7' : '#F9FAFB',
                borderWidth: settings.vitesseVocale === speed.id ? 2 : 0,
                borderColor: '#F59E0B',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: settings.vitesseVocale === speed.id ? '#B45309' : '#6B7280' }}>
                {speed.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <ToggleRow
          label={t('settings.vibrations')}
          description={t('settings.vibrations_desc')}
          value={settings.vibrationsActives}
          onToggle={settings.toggleVibrations}
        />
      </View>
    </View>
  );
}

// Section Notifications
function NotificationsSection({ settings }: { settings: SettingsStore }) {
  const t = useTranslation();
  const display = useDisplaySettings();

  const toggleRappelJour = (jour: number) => {
    const current = settings.rappelsJoursAvant;
    if (current.includes(jour)) {
      settings.setRappelsJours(current.filter((j) => j !== jour));
    } else {
      settings.setRappelsJours([...current, jour].sort((a, b) => a - b));
    }
  };

  return (
    <View className="space-y-5">
      <View className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: display.colors.card }}>
        <ToggleRow
          label={t('settings.notif_toggle')}
          description={t('settings.notif_desc')}
          value={settings.notificationsActives}
          onToggle={settings.toggleNotifications}
        />
        <ToggleRow
          label={t('settings.notif_sounds')}
          description={t('settings.notif_sounds_desc')}
          value={settings.sonsNotification}
          onToggle={settings.toggleSonsNotification}
        />
      </View>

      <View className="rounded-2xl p-5" style={{ backgroundColor: display.colors.card }}>
        <Text className="mb-4" style={{ fontFamily: 'Nunito_700Bold', fontSize: display.fontSize.lg, color: display.colors.text }}>
          {t('settings.reminders')}
        </Text>
        <View className="space-y-3">
          {[1, 3, 7].map((jour) => (
            <Pressable
              key={jour}
              onPress={() => toggleRappelJour(jour)}
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{ backgroundColor: settings.rappelsJoursAvant.includes(jour) ? '#D1FAE5' : '#F9FAFB' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: '#374151' }}>
                {t('settings.days_before', { count: jour, s: jour > 1 ? 's' : '' })}
              </Text>
              {settings.rappelsJoursAvant.includes(jour) && <Check size={24} color="#10B981" />}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// Section À propos
function AProposSection() {
  const router = useRouter();
  const t = useTranslation();
  const display = useDisplaySettings();

  const handleResetOnboarding = () => {
    Alert.alert(
      t('settings.tutorial_confirm'),
      t('settings.tutorial_msg'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.yes'),
          onPress: async () => {
            await AsyncStorage.removeItem('monadmin_settings');
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <View className="space-y-5">
      <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: display.colors.card }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📱</Text>
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: display.fontSize['2xl'], color: display.colors.text }}>
          MonAdmin
        </Text>
        <Text className="mt-1" style={{ fontFamily: 'Nunito_400Regular', fontSize: display.fontSize.base, color: display.colors.textMuted }}>
          Version 2.0.0
        </Text>
        <Text className="text-center mt-4 px-4" style={{ fontFamily: 'Nunito_400Regular', fontSize: display.fontSize.base, color: display.colors.textMuted }}>
          {t('settings.app_desc')}
        </Text>
      </View>

      <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: display.colors.card }}>
        {[
          { label: t('settings.faq'), icon: '❓', route: '/faq' as const },
          { label: t('settings.privacy'), icon: '🔒', route: '/confidentialite' as const },
          { label: t('settings.terms'), icon: '📄', route: '/cgu' as const },
        ].map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route)}
            className="p-5 flex-row items-center active:bg-gray-50"
            style={{ borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#F3F4F6' }}
          >
            <Text style={{ fontSize: 24, marginRight: 16 }}>{item.icon}</Text>
            <Text className="flex-1" style={{ fontFamily: 'Nunito_600SemiBold', fontSize: display.fontSize.lg, color: display.colors.text }}>
              {item.label}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleResetOnboarding}
        className="rounded-2xl p-5 flex-row items-center active:bg-gray-50"
        style={{ backgroundColor: display.colors.card }}
      >
        <Text style={{ fontSize: 24, marginRight: 16 }}>🎓</Text>
        <Text className="flex-1" style={{ fontFamily: 'Nunito_600SemiBold', fontSize: display.fontSize.lg, color: display.colors.text }}>
          {t('settings.tutorial')}
        </Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </Pressable>

      <View className="items-center py-4">
        <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: display.fontSize.sm, color: display.colors.textMuted }}>
          {t('settings.footer')}
        </Text>
      </View>
    </View>
  );
}
