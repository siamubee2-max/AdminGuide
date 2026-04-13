import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mic, Square, Sparkles, HelpCircle } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useDocumentStore } from '@/lib/state/document-store';
import { useSettingsStore, getVoiceRate } from '@/lib/state/settings-store';
import { useHistoryStore } from '@/lib/state/history-store';
import { processVoiceCommand } from '@/lib/services/ai-service';
import { usePremium } from '@/lib/hooks/usePremium';
import { useTranslation, getSpeechLanguageCode } from '@/lib/i18n';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VocalScreen() {
  const router = useRouter();
  const t = useTranslation();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ type: 'user' | 'assistant'; text: string }>
  >([]);

  const documents = useDocumentStore((s) => s.documents);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);
  const vitesseVocale = useSettingsStore((s) => s.vitesseVocale);
  const language = useSettingsStore((s) => s.language);
  const { requireFeature } = usePremium();
  const volumeVocal = useSettingsStore((s) => s.volumeVocal);
  const addAction = useHistoryStore((s) => s.addAction);

  // Animations
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const avatarScale = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring3Scale = useSharedValue(1);

  useEffect(() => {
    if (voiceState === 'listening' || voiceState === 'processing') {
      pulseScale.value = withRepeat(
        withTiming(1.4, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
      
      ring1Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      ring2Scale.value = withDelay(200, withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      ));
      ring3Scale.value = withDelay(400, withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      ));
      
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.4, { duration: 300 });
      avatarScale.value = withTiming(1, { duration: 300 });
      ring1Scale.value = withTiming(1, { duration: 300 });
      ring2Scale.value = withTiming(1, { duration: 300 });
      ring3Scale.value = withTiming(1, { duration: 300 });
    }
  }, [voiceState]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: interpolate(ring1Scale.value, [1, 1.3], [0.3, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: interpolate(ring2Scale.value, [1, 1.3], [0.25, 0]),
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: interpolate(ring3Scale.value, [1, 1.3], [0.2, 0]),
  }));

  const speak = useCallback(async (text: string) => {
    setVoiceState('speaking');
    setResponse(text);

    await Speech.speak(text, {
      language: getSpeechLanguageCode(language),
      rate: getVoiceRate(vitesseVocale),
      volume: volumeVocal / 100,
      onDone: () => setVoiceState('idle'),
      onStopped: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  }, [vitesseVocale, volumeVocal, language]);

  const handleVoiceCommand = useCallback(async (text: string) => {
    setVoiceState('processing');
    
    // Add user message to history
    setConversationHistory((prev) => [...prev, { type: 'user', text }]);
    
    // Track voice question
    addAction({
      type: 'voice_question',
      title: 'Question vocale',
      description: text.length > 50 ? text.substring(0, 50) + '...' : text,
    });
    
    try {
      const result = await processVoiceCommand(text, {
        documentsCount: documents.length,
        currentPage: 'vocal',
      }, language);
      
      // Add assistant response to history
      setConversationHistory((prev) => [...prev, { type: 'assistant', text: result.reponse }]);
      
      // Track voice answer
      addAction({
        type: 'voice_answer',
        title: 'Réponse de MonAdmin',
        description: result.reponse.length > 50 ? result.reponse.substring(0, 50) + '...' : result.reponse,
      });
      
      // Handle action if any
      if (result.action) {
        switch (result.action.type) {
          case 'navigation':
            await speak(result.reponse);
            if (result.action.cible === 'scanner') {
              router.push('/(tabs)/scanner');
            } else if (result.action.cible === 'documents') {
              router.push('/(tabs)/documents');
            }
            break;
            
          case 'lire_document':
            if (documents.length > 0) {
              const lastDoc = documents[0];
              setCurrentDocument(lastDoc);
              const fullResponse = `${result.reponse} ${lastDoc.titre}. ${lastDoc.explication}. Ce que vous devez faire: ${lastDoc.action}`;
              await speak(fullResponse);
            } else {
              await speak("Vous n'avez pas encore de courriers scannés.");
            }
            break;
            
          case 'lister_actions':
            const urgentDocs = documents.filter((d) => d.urgence === 'rouge' || d.urgence === 'orange');
            if (urgentDocs.length > 0) {
              const actionsList = urgentDocs
                .slice(0, 3)
                .map((d) => d.action)
                .join('. Ensuite, ');
              await speak(`Vous avez ${urgentDocs.length} actions en attente. Premièrement, ${actionsList}.`);
            } else {
              await speak("Vous n'avez aucune action urgente en attente. Tout va bien !");
            }
            break;
            
          default:
            await speak(result.reponse);
        }
      } else {
        await speak(result.reponse);
      }
    } catch (error) {
      console.error('Voice command error:', error);
      await speak("Désolé, je n'ai pas compris. Pouvez-vous répéter ?");
    }
  }, [documents, speak, router, setCurrentDocument]);

  const toggleListening = async () => {
    if (voiceState === 'idle' && !requireFeature('voice_reading')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (voiceState === 'listening') {
      // Stop listening - simulate voice recognition result
      setVoiceState('processing');
      
      // Simulated transcription (in production, use real speech-to-text)
      const simulatedTranscripts = [
        'Lis-moi mon dernier courrier',
        "Qu'est-ce que je dois faire cette semaine",
        'Scanner un courrier',
        'Aide',
      ];
      const randomTranscript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
      setTranscript(randomTranscript);
      
      await handleVoiceCommand(randomTranscript);
    } else if (voiceState === 'idle') {
      setVoiceState('listening');
      setTranscript('');
      setResponse('');
      
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setVoiceState((current) => current === 'listening' ? 'idle' : current);
      }, 10000);
    } else if (voiceState === 'speaking') {
      Speech.stop();
      setVoiceState('idle');
    }
  };

  const handleExamplePress = async (text: string) => {
    if (!requireFeature('voice_reading')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranscript(text);
    await handleVoiceCommand(text);
  };

  const examples = [
    { icon: '📖', text: t('voice.example1') },
    { icon: '📅', text: t('voice.example2') },
    { icon: '📷', text: t('voice.example3') },
  ];

  const getAvatarEmoji = () => {
    switch (voiceState) {
      case 'listening': return '👂';
      case 'processing': return '🤔';
      case 'speaking': return '🗣️';
      default: return '🤖';
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'listening': return t('voice.listening');
      case 'processing': return t('voice.processing');
      case 'speaking': return t('voice.speaking');
      default: return t('voice.idle');
    }
  };

  return (
    <LinearGradient
      colors={voiceState === 'listening' || voiceState === 'processing'
        ? ['#047857', '#059669', '#10B981'] 
        : voiceState === 'speaking'
        ? ['#7C3AED', '#8B5CF6', '#A78BFA']
        : ['#1E40AF', '#2563EB', '#3B82F6']
      }
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(400)}
          className="px-6 pt-6"
        >
          <Pressable
            onPress={() => {
              Speech.stop();
              router.back();
            }}
            className="flex-row items-center active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ChevronLeft size={24} color="white" />
            </View>
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {t('common.back')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-8">
          {/* Avatar with animated rings */}
          <View className="items-center mb-10">
            {(voiceState === 'listening' || voiceState === 'processing') && (
              <>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 240,
                      height: 240,
                      borderRadius: 120,
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                    },
                    ring3Style,
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 220,
                      height: 220,
                      borderRadius: 110,
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                    },
                    ring2Style,
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      borderWidth: 3,
                      borderColor: '#FFFFFF',
                    },
                    ring1Style,
                  ]}
                />
              </>
            )}
            
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  backgroundColor: '#FFFFFF',
                },
                pulseStyle,
              ]}
            />

            <Animated.View style={avatarAnimatedStyle}>
              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 15,
                }}
              >
                <Text style={{ fontSize: 72 }}>{getAvatarEmoji()}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Status Text */}
          <Animated.View entering={FadeIn.duration(400)} className="items-center mb-6">
            <Text
              className="text-4xl text-white text-center mb-3"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {getStatusText()}
            </Text>
            
            {voiceState === 'idle' && (
              <Text
                className="text-lg text-white/80 text-center leading-7"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {t('voice.press_mic')}
              </Text>
            )}
            
            {voiceState === 'listening' && (
              <View className="flex-row items-center mt-2">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#FEE2E2' }}
                />
                <Text
                  className="text-white/90 text-base"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {t('voice.speak_now')}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Transcript/Response display */}
          {(transcript || response) && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="w-full rounded-2xl p-4 mb-6 max-h-40"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {transcript && (
                  <View className="mb-2">
                    <Text className="text-white/60 text-xs mb-1" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      {t('voice.you_said')}
                    </Text>
                    <Text className="text-white text-base" style={{ fontFamily: 'Nunito_400Regular' }}>
                      "{transcript}"
                    </Text>
                  </View>
                )}
                {response && (
                  <View>
                    <Text className="text-white/60 text-xs mb-1" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      {t('voice.assistant')}
                    </Text>
                    <Text className="text-white text-base" style={{ fontFamily: 'Nunito_400Regular' }}>
                      {response}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          )}

          {/* Examples - Only when idle */}
          {voiceState === 'idle' && !transcript && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="w-full rounded-3xl p-5 mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              <View className="flex-row items-center mb-4">
                <HelpCircle size={20} color="rgba(255,255,255,0.8)" />
                <Text
                  className="text-white/80 text-base ml-2"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {t('voice.examples')}
                </Text>
              </View>
              {examples.map((example, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleExamplePress(example.text)}
                  className="flex-row items-center py-3 active:opacity-70"
                  style={{
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{example.icon}</Text>
                  <Text
                    className="text-white text-lg flex-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    "{example.text}"
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Mic Button */}
        <Animated.View 
          entering={FadeInUp.duration(400).delay(300)}
          className="items-center pb-10"
        >
          <Pressable
            onPress={toggleListening}
            className="active:scale-95"
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: voiceState === 'listening' ? '#EF4444' 
                : voiceState === 'speaking' ? '#7C3AED'
                : '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: voiceState === 'listening' ? '#EF4444' : '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            {voiceState === 'listening' ? (
              <Square size={32} color="white" fill="white" />
            ) : voiceState === 'speaking' ? (
              <Square size={32} color="white" fill="white" />
            ) : (
              <Mic size={38} color="#2563EB" strokeWidth={2.5} />
            )}
          </Pressable>
          
          <Text
            className="text-white/80 text-base mt-5"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {voiceState === 'listening' ? t('voice.press_to_stop')
              : voiceState === 'speaking' ? t('voice.press_to_stop')
              : t('voice.press_to_speak')}
          </Text>
          
          {voiceState === 'idle' && (
            <View className="flex-row items-center mt-4">
              <Sparkles size={16} color="rgba(255,255,255,0.6)" />
              <Text
                className="text-white/60 text-sm ml-2"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {t('voice.ai_label')}
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
