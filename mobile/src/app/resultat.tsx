import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Volume2, VolumeX, PenLine, Clock, FolderOpen,
  Calendar, Wallet, CheckCircle2, X, Copy, Bell, BellOff, Trash2, Share2, Users,
  Play, Square, BookOpen, Camera
} from 'lucide-react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useDocumentStore } from '@/lib/state/document-store';
import { useSettingsStore, getVoiceRate } from '@/lib/state/settings-store';
import { useHistoryStore } from '@/lib/state/history-store';
import { generateResponseWithAI } from '@/lib/services/ai-service';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { URGENCE_STYLES } from '@/lib/types';
import { ScheduledReminder } from '@/lib/services/notification-service';
import { ShareDocumentModal } from '@/components/ShareDocumentModal';
import { useFamilyStore } from '@/lib/state/family-store';
import { usePremium } from '@/lib/hooks/usePremium';
import { useTranslation, getSpeechLanguageCode } from '@/lib/i18n';

type ReadMode = 'resume' | 'complet';

function SoundWave({ active, color }: { active: boolean; color: string }) {
  const bar1 = useSharedValue(0.3);
  const bar2 = useSharedValue(0.6);
  const bar3 = useSharedValue(0.4);
  const bar4 = useSharedValue(0.7);
  const bar5 = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      bar1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.2, { duration: 300 })), -1, true);
      bar2.value = withRepeat(withSequence(withTiming(0.8, { duration: 300 }), withTiming(0.3, { duration: 400 })), -1, true);
      bar3.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.15, { duration: 350 })), -1, true);
      bar4.value = withRepeat(withSequence(withTiming(0.7, { duration: 350 }), withTiming(0.25, { duration: 300 })), -1, true);
      bar5.value = withRepeat(withSequence(withTiming(0.9, { duration: 280 }), withTiming(0.2, { duration: 420 })), -1, true);
    } else {
      bar1.value = withTiming(0.3, { duration: 300 });
      bar2.value = withTiming(0.3, { duration: 300 });
      bar3.value = withTiming(0.3, { duration: 300 });
      bar4.value = withTiming(0.3, { duration: 300 });
      bar5.value = withTiming(0.3, { duration: 300 });
    }
  }, [active]);

  const s1 = useAnimatedStyle(() => ({ height: bar1.value * 28, backgroundColor: color }));
  const s2 = useAnimatedStyle(() => ({ height: bar2.value * 28, backgroundColor: color }));
  const s3 = useAnimatedStyle(() => ({ height: bar3.value * 28, backgroundColor: color }));
  const s4 = useAnimatedStyle(() => ({ height: bar4.value * 28, backgroundColor: color }));
  const s5 = useAnimatedStyle(() => ({ height: bar5.value * 28, backgroundColor: color }));

  return (
    <View className="flex-row items-center" style={{ gap: 3, height: 28 }}>
      {[s1, s2, s3, s4, s5].map((s, i) => (
        <Animated.View key={i} style={[{ width: 4, borderRadius: 2 }, s]} />
      ))}
    </View>
  );
}

export default function ResultatScreen() {
  const t = useTranslation();
  const router = useRouter();
  const currentDocument = useDocumentStore((s) => s.currentDocument);
  const archiveDocument = useDocumentStore((s) => s.archiveDocument);
  const profile = useSettingsStore((s) => s.profile);
  const vitesseVocale = useSettingsStore((s) => s.vitesseVocale);
  const rappelsJoursAvant = useSettingsStore((s) => s.rappelsJoursAvant);
  const language = useSettingsStore((s) => s.language);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readMode, setReadMode] = useState<ReadMode>('resume');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<{
    objet: string;
    corps: string;
    signature: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReminderOption, setSelectedReminderOption] = useState<string>('');
  const [documentReminders, setDocumentReminders] = useState<ScheduledReminder[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const familyMembers = useFamilyStore((s) => s.members);
  const documentShares = useFamilyStore((s) => s.getDocumentShares);
  const loadFamily = useFamilyStore((s) => s.loadFamily);

  const { 
    isEnabled: notificationsEnabled,
    requestPermission,
    scheduleReminder,
    scheduleAutomaticReminders,
    cancelReminder,
    getDocumentReminders,
  } = useNotifications();

  const addAction = useHistoryStore((s) => s.addAction);
  const { requirePremium } = usePremium();

  // Load existing reminders, family, and track view
  useEffect(() => {
    loadFamily();
  }, []);

  useEffect(() => {
    if (currentDocument) {
      getDocumentReminders(currentDocument.id).then(setDocumentReminders);
      
      // Track document view
      addAction({
        type: 'view',
        title: t('result.doc_viewed'),
        documentId: String(currentDocument.id),
        documentTitle: currentDocument.titre,
      });
    }
  }, [currentDocument?.id]);

  // Stop speech when leaving the screen
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (!currentDocument) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Animated.View
          entering={FadeIn.duration(500)}
          className="items-center"
        >
          <View
            className="w-28 h-28 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text style={{ fontSize: 56 }}>📄</Text>
          </View>
          <Text
            className="text-2xl text-text-primary text-center mb-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {t('result.no_doc')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-2xl px-10 py-4 active:scale-95 mt-4"
            style={{ backgroundColor: '#2563EB' }}
          >
            <Text className="text-white text-lg" style={{ fontFamily: 'Nunito_700Bold' }}>
              {t('result.back')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const urgenceStyle = URGENCE_STYLES[currentDocument.urgence];

  const handleReadAloud = async (mode?: ReadMode) => {
    if (!requirePremium()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const selectedMode = mode ?? readMode;
      setReadMode(selectedMode);
      setIsSpeaking(true);

      let textToRead: string;
      if (selectedMode === 'complet' && currentDocument.contenuBrut) {
        textToRead = currentDocument.contenuBrut;
      } else {
        textToRead = `${currentDocument.titre}. ${currentDocument.explication}. ${t('result.action')}: ${currentDocument.action}`;
      }

      Speech.speak(textToRead, {
        language: getSpeechLanguageCode(language),
        rate: getVoiceRate(vitesseVocale),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleArchive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Track archive action
    addAction({
      type: 'archived',
      title: t('result.doc_archived'),
      documentId: String(currentDocument.id),
      documentTitle: currentDocument.titre,
    });

    archiveDocument(currentDocument.id);
    router.replace('/(tabs)/documents');
  };

  const handleGenerateResponse = async () => {
    if (!requirePremium()) return;
    setShowResponseModal(true);
    setIsGenerating(true);

    try {
      const response = await generateResponseWithAI(currentDocument, {
        prenom: profile.prenom,
        nom: profile.nom,
        adresse: profile.adresse,
      }, language);
      setGeneratedResponse(response);

      // Track response generation
      addAction({
        type: 'note_added',
        title: t('result.response_generated'),
        description: `Aide à la rédaction pour ${currentDocument.organisme}`,
        documentId: String(currentDocument.id),
        documentTitle: currentDocument.titre,
      });
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyResponse = async () => {
    if (generatedResponse) {
      const fullText = `Objet : ${generatedResponse.objet}\n\n${generatedResponse.corps}\n\n${generatedResponse.signature}`;
      await Clipboard.setStringAsync(fullText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleOpenReminderModal = async () => {
    if (!requirePremium()) return;
    // Check/request permission first
    if (!notificationsEnabled) {
      const granted = await requestPermission();
      if (!granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }
    setShowReminderModal(true);
  };

  const handleSetReminder = async () => {
    if (!selectedReminderOption) return;
    
    setIsScheduling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let reminderDate = new Date();
      
      switch (selectedReminderOption) {
        case 'demain':
          reminderDate.setDate(reminderDate.getDate() + 1);
          reminderDate.setHours(9, 0, 0, 0);
          break;
        case '3jours':
          reminderDate.setDate(reminderDate.getDate() + 3);
          reminderDate.setHours(9, 0, 0, 0);
          break;
        case 'semaine':
          reminderDate.setDate(reminderDate.getDate() + 7);
          reminderDate.setHours(9, 0, 0, 0);
          break;
        case 'auto':
          // Schedule automatic reminders based on deadline
          await scheduleAutomaticReminders(currentDocument, rappelsJoursAvant);
          break;
      }

      if (selectedReminderOption !== 'auto') {
        await scheduleReminder(currentDocument, reminderDate, 'custom');
      }

      // Refresh reminders list
      const updated = await getDocumentReminders(currentDocument.id);
      setDocumentReminders(updated);

      // Track reminder creation
      addAction({
        type: 'reminder_set',
        title: t('result.reminder_set'),
        description: selectedReminderOption === 'auto'
          ? 'Rappels automatiques activés'
          : `Rappel ${selectedReminderOption === 'demain' ? 'demain' : selectedReminderOption === '3jours' ? 'dans 3 jours' : 'dans une semaine'}`,
        documentId: String(currentDocument.id),
        documentTitle: currentDocument.titre,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowReminderModal(false);
      setSelectedReminderOption('');
    } catch (error) {
      console.error('Error setting reminder:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelReminder = async (notificationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cancelReminder(notificationId);
    const updated = await getDocumentReminders(currentDocument.id);
    setDocumentReminders(updated);
  };

  const formatReminderDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={urgenceStyle.gradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4 flex-row items-center justify-between"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
            >
              <ChevronLeft size={24} color={urgenceStyle.text} />
            </View>
            <Text
              className="text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold', color: urgenceStyle.text }}
            >
              {t('result.back')}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleReadAloud()}
            className="w-14 h-14 rounded-2xl items-center justify-center active:scale-95"
            style={{ 
              backgroundColor: isSpeaking ? urgenceStyle.border : 'rgba(255,255,255,0.9)',
            }}
          >
            {isSpeaking ? (
              <VolumeX size={26} color="white" />
            ) : (
              <Volume2 size={26} color={urgenceStyle.text} />
            )}
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge d'urgence */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="items-center mb-4"
          >
            <View
              className="rounded-full px-6 py-3 flex-row items-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderWidth: 3,
                borderColor: urgenceStyle.border,
              }}
            >
              <Text style={{ fontSize: 22 }}>{urgenceStyle.icon}</Text>
              <Text
                className="ml-2"
                style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: urgenceStyle.text }}
              >
                {urgenceStyle.label}
              </Text>
            </View>
          </Animated.View>

          {/* Scheduled reminders indicator */}
          {documentReminders.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="mb-4"
            >
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#BFDBFE' }}
              >
                <View className="flex-row items-center mb-2">
                  <Bell size={18} color="#2563EB" />
                  <Text
                    className="ml-2 text-base"
                    style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}
                  >
                    {t('result.reminders_count', { count: documentReminders.length, s: documentReminders.length > 1 ? 's' : '' })}
                  </Text>
                </View>
                {documentReminders.slice(0, 2).map((reminder) => (
                  <View key={reminder.id} className="flex-row items-center justify-between py-1">
                    <Text
                      className="text-sm flex-1"
                      style={{ fontFamily: 'Nunito_400Regular', color: '#3B82F6' }}
                    >
                      📅 {formatReminderDate(reminder.scheduledDate)}
                    </Text>
                    <Pressable
                      onPress={() => handleCancelReminder(reminder.notificationId)}
                      className="p-1"
                    >
                      <X size={16} color="#6B7280" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Document Card */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            className="bg-white rounded-3xl overflow-hidden mb-5"
            style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}
          >
            <View className="px-6 pt-6 pb-3 border-b border-gray-100">
              <View className="self-start rounded-xl px-4 py-2" style={{ backgroundColor: '#F3F4F6' }}>
                <Text className="text-base" style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>
                  {currentDocument.type} • {currentDocument.organisme}
                </Text>
              </View>
            </View>

            <View className="px-6 py-5">
              <Text
                className="text-2xl text-text-primary leading-9"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {currentDocument.titre}
              </Text>
            </View>

            {(currentDocument.montant || currentDocument.dateLimite) && (
              <View className="px-6 pb-5">
                <View className="flex-row">
                  {currentDocument.montant && (
                    <View className="flex-1 rounded-2xl p-4 mr-2" style={{ backgroundColor: '#D1FAE5' }}>
                      <View className="flex-row items-center mb-2">
                        <Wallet size={20} color="#059669" />
                        <Text className="ml-2 text-sm" style={{ fontFamily: 'Nunito_600SemiBold', color: '#047857' }}>
                          {t('result.amount')}
                        </Text>
                      </View>
                      <Text className="text-2xl" style={{ fontFamily: 'Nunito_800ExtraBold', color: '#047857' }}>
                        {currentDocument.montant}
                      </Text>
                    </View>
                  )}
                  {currentDocument.dateLimite && (
                    <View className="flex-1 rounded-2xl p-4 ml-2" style={{ backgroundColor: '#FEE2E2' }}>
                      <View className="flex-row items-center mb-2">
                        <Calendar size={20} color="#DC2626" />
                        <Text className="ml-2 text-sm" style={{ fontFamily: 'Nunito_600SemiBold', color: '#991B1B' }}>
                          {t('result.deadline')}
                        </Text>
                      </View>
                      <Text className="text-xl" style={{ fontFamily: 'Nunito_800ExtraBold', color: '#991B1B' }}>
                        {currentDocument.dateLimite}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Explication */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mb-5">
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              style={{ borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#BFDBFE' }}
            >
              <View className="flex-row items-center mb-4">
                <Text style={{ fontSize: 28 }}>💬</Text>
                <Text className="ml-3 text-xl" style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}>
                  {t('result.explanation')}
                </Text>
              </View>
              <Text className="text-lg leading-8" style={{ fontFamily: 'Nunito_400Regular', color: '#1E3A8A' }}>
                {currentDocument.explication}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Action */}
          <Animated.View entering={FadeInUp.duration(400).delay(250)} className="mb-6">
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              style={{ borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#A7F3D0' }}
            >
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <CheckCircle2 size={24} color="white" />
                </View>
                <Text className="ml-3 text-xl" style={{ fontFamily: 'Nunito_700Bold', color: '#047857' }}>
                  {t('result.action')}
                </Text>
              </View>
              <Text className="text-lg leading-8" style={{ fontFamily: 'Nunito_600SemiBold', color: '#065F46' }}>
                {currentDocument.action}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Audio Reader Card */}
          <Animated.View entering={FadeInUp.duration(400).delay(275)} className="mb-6">
            <View
              className="rounded-3xl overflow-hidden"
              style={{
                backgroundColor: '#1E293B',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              {/* Header with icon */}
              <View className="px-6 pt-5 pb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: '#7C3AED' }}
                    >
                      <BookOpen size={24} color="white" />
                    </View>
                    <View className="ml-3">
                      <Text
                        className="text-lg text-white"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {t('result.read_title')}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ fontFamily: 'Nunito_400Regular', color: '#94A3B8' }}
                      >
                        {isSpeaking ? t('result.reading') : t('result.read_instruction')}
                      </Text>
                    </View>
                  </View>
                  {isSpeaking && <SoundWave active={isSpeaking} color="#A78BFA" />}
                </View>
              </View>

              {/* Mode selector */}
              <View className="px-6 py-3 flex-row" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => {
                    if (isSpeaking) {
                      Speech.stop();
                      setIsSpeaking(false);
                    }
                    setReadMode('complet');
                  }}
                  className="flex-1 rounded-xl py-3 items-center active:scale-[0.97]"
                  style={{
                    backgroundColor: readMode === 'complet' ? '#7C3AED' : '#334155',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      color: readMode === 'complet' ? 'white' : '#94A3B8',
                    }}
                  >
                    {t('result.mode_full')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (isSpeaking) {
                      Speech.stop();
                      setIsSpeaking(false);
                    }
                    setReadMode('resume');
                  }}
                  className="flex-1 rounded-xl py-3 items-center active:scale-[0.97]"
                  style={{
                    backgroundColor: readMode === 'resume' ? '#7C3AED' : '#334155',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      color: readMode === 'resume' ? 'white' : '#94A3B8',
                    }}
                  >
                    {t('result.mode_summary')}
                  </Text>
                </Pressable>
              </View>

              {/* Play / Stop button */}
              <View className="px-6 pt-2 pb-5">
                <Pressable
                  onPress={() => handleReadAloud(readMode)}
                  className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.97]"
                  style={{
                    backgroundColor: isSpeaking ? '#EF4444' : '#7C3AED',
                  }}
                >
                  {isSpeaking ? (
                    <>
                      <Square size={22} color="white" fill="white" />
                      <Text
                        className="text-lg text-white ml-3"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {t('result.stop_reading')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Play size={22} color="white" fill="white" />
                      <Text
                        className="text-lg text-white ml-3"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {t('result.read_aloud')}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="space-y-4">
            <Pressable
              onPress={handleGenerateResponse}
              className="rounded-3xl overflow-hidden active:scale-[0.98]"
              style={{ shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 }}
            >
              <LinearGradient colors={['#2563EB', '#1D4ED8']} style={{ padding: 20, borderRadius: 24 }}>
                <View className="flex-row items-center justify-center">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <PenLine size={24} color="white" />
                  </View>
                  <Text className="text-xl text-white" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                    {t('result.help_respond')}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleOpenReminderModal}
              className="rounded-3xl overflow-hidden active:scale-[0.98]"
              style={{ shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={{ padding: 18, borderRadius: 24 }}>
                <View className="flex-row items-center justify-center">
                  <Bell size={24} color="white" />
                  <Text className="text-xl text-white ml-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {t('result.remind_later')}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!requirePremium()) return;
                setShowShareModal(true);
              }}
              className="rounded-3xl overflow-hidden active:scale-[0.98]"
              style={{ shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={{ padding: 18, borderRadius: 24 }}>
                <View className="flex-row items-center justify-center">
                  <Users size={24} color="white" />
                  <Text className="text-xl text-white ml-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {t('result.share_family')}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleArchive}
              className="rounded-3xl py-5 flex-row items-center justify-center active:scale-[0.98]"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB' }}
            >
              <FolderOpen size={24} color="#6B7280" />
              <Text className="text-xl ml-3" style={{ fontFamily: 'Nunito_700Bold', color: '#374151' }}>
                {t('result.archive')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/scanner');
              }}
              className="rounded-3xl py-5 flex-row items-center justify-center active:scale-[0.98]"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <Camera size={24} color="#6B7280" />
              <Text className="text-xl ml-3" style={{ fontFamily: 'Nunito_700Bold', color: '#374151' }}>
                {t('result.scan_another')}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Response Modal */}
      <Modal visible={showResponseModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowResponseModal(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
              <Text className="text-2xl text-text-primary" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {t('result.response_title')}
              </Text>
              <Pressable onPress={() => setShowResponseModal(false)} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {isGenerating ? (
                <View className="items-center justify-center py-20">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="text-lg text-text-secondary mt-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {t('result.generating')}
                  </Text>
                </View>
              ) : generatedResponse && (
                <View className="space-y-4">
                  <View className="bg-white rounded-2xl p-5">
                    <Text className="text-sm text-text-secondary mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>{t('result.subject')}</Text>
                    <Text className="text-lg text-text-primary" style={{ fontFamily: 'Nunito_700Bold' }}>{generatedResponse.objet}</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-5">
                    <Text className="text-sm text-text-secondary mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>{t('result.content')}</Text>
                    <Text className="text-base text-text-primary leading-7" style={{ fontFamily: 'Nunito_400Regular' }}>{generatedResponse.corps}</Text>
                  </View>
                  <View className="bg-white rounded-2xl p-5">
                    <Text className="text-sm text-text-secondary mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>{t('result.signature')}</Text>
                    <Text className="text-base text-text-primary" style={{ fontFamily: 'Nunito_400Regular' }}>{generatedResponse.signature}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {generatedResponse && (
              <View className="px-6 py-4 border-t border-gray-200">
                <Pressable onPress={handleCopyResponse} className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98]" style={{ backgroundColor: '#2563EB' }}>
                  <Copy size={22} color="white" />
                  <Text className="text-lg text-white ml-3" style={{ fontFamily: 'Nunito_700Bold' }}>{t('result.copy_response')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Reminder Modal */}
      <Modal visible={showReminderModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowReminderModal(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
              <Text className="text-2xl text-text-primary" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {t('result.reminder_title')}
              </Text>
              <Pressable onPress={() => setShowReminderModal(false)} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
                {t('result.reminder_question')}
              </Text>

              <View className="space-y-3">
                {[
                  { id: 'demain', label: t('result.tomorrow'), desc: '9h00', icon: '☀️' },
                  { id: '3jours', label: t('result.3days'), desc: '9h00', icon: '📅' },
                  { id: 'semaine', label: t('result.1week'), desc: '9h00', icon: '📆' },
                  ...(currentDocument.dateLimite ? [{ id: 'auto', label: t('result.auto_reminders'), desc: `J-${rappelsJoursAvant.join(', J-')}`, icon: '🤖' }] : []),
                ].map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedReminderOption(option.id)}
                    className="p-5 rounded-2xl flex-row items-center"
                    style={{
                      backgroundColor: selectedReminderOption === option.id ? '#FEF3C7' : '#F9FAFB',
                      borderWidth: selectedReminderOption === option.id ? 2 : 0,
                      borderColor: '#F59E0B',
                    }}
                  >
                    <Text style={{ fontSize: 28, marginRight: 16 }}>{option.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className="text-lg"
                        style={{ fontFamily: 'Nunito_600SemiBold', color: selectedReminderOption === option.id ? '#92400E' : '#374151' }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
                      >
                        {option.desc}
                      </Text>
                    </View>
                    {selectedReminderOption === option.id && <CheckCircle2 size={24} color="#F59E0B" />}
                  </Pressable>
                ))}
              </View>

              {/* Existing reminders */}
              {documentReminders.length > 0 && (
                <View className="mt-8">
                  <Text className="text-base text-text-secondary mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {t('result.existing_reminders')}
                  </Text>
                  {documentReminders.map((reminder) => (
                    <View
                      key={reminder.id}
                      className="flex-row items-center justify-between p-4 rounded-xl mb-2"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <View className="flex-row items-center flex-1">
                        <Bell size={18} color="#6B7280" />
                        <Text className="text-sm ml-2 flex-1" style={{ fontFamily: 'Nunito_400Regular', color: '#374151' }}>
                          {formatReminderDate(reminder.scheduledDate)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleCancelReminder(reminder.notificationId)}
                        className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View className="px-6 py-4 border-t border-gray-200">
              <Pressable
                onPress={handleSetReminder}
                disabled={!selectedReminderOption || isScheduling}
                className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98]"
                style={{ backgroundColor: selectedReminderOption ? '#F59E0B' : '#E5E7EB' }}
              >
                {isScheduling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Bell size={22} color={selectedReminderOption ? 'white' : '#9CA3AF'} />
                    <Text className="text-lg ml-3" style={{ fontFamily: 'Nunito_700Bold', color: selectedReminderOption ? 'white' : '#9CA3AF' }}>
                      {t('result.create_reminder')}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Share Modal */}
      {currentDocument && (
        <ShareDocumentModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          document={currentDocument}
        />
      )}
    </View>
  );
}
