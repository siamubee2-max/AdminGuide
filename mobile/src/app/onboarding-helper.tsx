import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Check,
  RefreshCw,
  Heart,
  User,
  Type,
  Bell,
  Volume2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

type HelperStep = 'info' | 'config' | 'code' | 'waiting';

interface SeniorConfig {
  prenom: string;
  avatar: string;
  fontSize: 'normal' | 'large' | 'xlarge';
  notifications: boolean;
  voiceSpeed: number;
}

export default function OnboardingHelperScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<HelperStep>('info');
  const [helperName, setHelperName] = useState('');
  const [helperPhone, setHelperPhone] = useState('');
  const [linkingCode, setLinkingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [seniorConfig, setSeniorConfig] = useState<SeniorConfig>({
    prenom: '',
    avatar: '👵',
    fontSize: 'large',
    notifications: true,
    voiceSpeed: 0.85,
  });

  // Animations
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Polling pour vérifier si le senior a utilisé le code
  useEffect(() => {
    if (currentStep === 'waiting' && linkingCode) {
      pollingRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/linking/status/${linkingCode}`);
          if (!response.ok) return;
          const data = await response.json();
          if (data.isLinked) {
            setIsLinked(true);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (error) {
          console.error('Error checking link status:', error);
        }
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentStep, linkingCode]);

  const generateCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/linking/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperName,
          helperPhone,
          seniorConfig,
        }),
      });

      if (!response.ok) {
        Alert.alert(
          'Service indisponible',
          'Le service de liaison est temporairement indisponible.',
          [
            { text: 'Réessayer', onPress: () => generateCode() },
            { text: 'Configurer manuellement', onPress: () => router.replace('/onboarding') },
          ],
        );
        return;
      }

      const data = await response.json();
      if (data.success) {
        setLinkingCode(data.code);
        setCurrentStep('code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Erreur', 'Impossible de générer le code. Réessayez.');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      Alert.alert(
        'Erreur de connexion',
        'Impossible de contacter le serveur. Vous pouvez réessayer ou configurer l\'app manuellement.',
        [
          { text: 'Réessayer', onPress: () => generateCode() },
          { text: 'Configurer manuellement', onPress: () => router.replace('/onboarding') },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfigOnServer = async () => {
    if (!linkingCode) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/linking/update-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: linkingCode,
          seniorConfig,
        }),
      });
      if (!response.ok) {
        console.error('Error updating config: server returned', response.status);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(linkingCode);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Bonjour ! J'ai préparé l'application MonAdmin pour toi. Télécharge l'app et entre ce code : ${linkingCode}\n\nCe code est valable 24 heures.`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (currentStep) {
      case 'info':
        if (helperName.trim()) {
          setCurrentStep('config');
        }
        break;
      case 'config':
        generateCode();
        break;
      case 'code':
        setCurrentStep('waiting');
        break;
      case 'waiting':
        if (isLinked) {
          router.replace('/(tabs)');
        }
        break;
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (currentStep) {
      case 'config':
        setCurrentStep('info');
        break;
      case 'code':
        setCurrentStep('config');
        break;
      case 'waiting':
        setCurrentStep('code');
        break;
    }
  };

  const getStepIndex = () => {
    const steps: HelperStep[] = ['info', 'config', 'code', 'waiting'];
    return steps.indexOf(currentStep);
  };

  const progress = ((getStepIndex() + 1) / 4) * 100;

  const avatars = ['👵', '👴', '🧓', '👩‍🦳', '👨‍🦳', '😊', '🙂', '😄'];

  return (
    <LinearGradient colors={['#059669', '#10B981', '#34D399']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Progress bar */}
        <View className="px-6 pt-4">
          <View className="h-2 bg-white/20 rounded-full overflow-hidden">
            <Animated.View
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: 'white',
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        {/* Back button */}
        <View className="px-6 pt-4 flex-row justify-between items-center">
          {currentStep !== 'info' ? (
            <Pressable
              onPress={handleBack}
              className="flex-row items-center active:opacity-70"
            >
              <ChevronLeft size={24} color="white" />
              <Text
                className="text-white text-base ml-1"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Retour
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center active:opacity-70"
            >
              <ChevronLeft size={24} color="white" />
              <Text
                className="text-white text-base ml-1"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Retour
              </Text>
            </Pressable>
          )}

          <View className="flex-row items-center">
            <Heart size={20} color="white" fill="white" />
            <Text
              className="text-white ml-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Mode Aidant
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Step: Info */}
          {currentStep === 'info' && (
            <Animated.View entering={FadeIn.duration(400)} className="pt-8">
              <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>
                💝
              </Text>
              <Text
                className="text-3xl text-white text-center mb-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Configurez l'app pour un proche
              </Text>
              <Text
                className="text-lg text-white/80 text-center mb-8"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Vous allez créer un code que votre proche pourra utiliser pour
                configurer son téléphone automatiquement.
              </Text>

              <View
                className="rounded-2xl p-6 mb-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <Text
                  className="text-gray-700 mb-2"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Votre prénom (l'aidant)
                </Text>
                <TextInput
                  value={helperName}
                  onChangeText={setHelperName}
                  placeholder="Ex: Marie"
                  placeholderTextColor="#9CA3AF"
                  className="text-xl py-3 px-4 rounded-xl"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    backgroundColor: '#F3F4F6',
                    color: '#1F2937',
                  }}
                />

                <Text
                  className="text-gray-700 mt-4 mb-2"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Votre téléphone (optionnel)
                </Text>
                <TextInput
                  value={helperPhone}
                  onChangeText={setHelperPhone}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="text-xl py-3 px-4 rounded-xl"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    backgroundColor: '#F3F4F6',
                    color: '#1F2937',
                  }}
                />
              </View>
            </Animated.View>
          )}

          {/* Step: Config */}
          {currentStep === 'config' && (
            <Animated.View entering={FadeIn.duration(400)} className="pt-8">
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>
                ⚙️
              </Text>
              <Text
                className="text-2xl text-white text-center mb-2"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Configurez pour votre proche
              </Text>
              <Text
                className="text-base text-white/70 text-center mb-6"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Ces réglages seront appliqués automatiquement
              </Text>

              {/* Senior name */}
              <View
                className="rounded-2xl p-5 mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <View className="flex-row items-center mb-3">
                  <User size={20} color="#059669" />
                  <Text
                    className="text-gray-700 ml-2"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Prénom de votre proche
                  </Text>
                </View>
                <TextInput
                  value={seniorConfig.prenom}
                  onChangeText={(text) =>
                    setSeniorConfig({ ...seniorConfig, prenom: text })
                  }
                  placeholder="Ex: Mamie, Papa, Grand-père..."
                  placeholderTextColor="#9CA3AF"
                  className="text-lg py-3 px-4 rounded-xl"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    backgroundColor: '#F3F4F6',
                    color: '#1F2937',
                  }}
                />
              </View>

              {/* Avatar */}
              <View
                className="rounded-2xl p-5 mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <Text
                  className="text-gray-700 mb-3"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Choisissez un avatar
                </Text>
                <View className="flex-row flex-wrap justify-center">
                  {avatars.map((avatar) => (
                    <Pressable
                      key={avatar}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSeniorConfig({ ...seniorConfig, avatar });
                      }}
                      className="m-1.5 w-14 h-14 rounded-full items-center justify-center"
                      style={{
                        backgroundColor:
                          seniorConfig.avatar === avatar ? '#D1FAE5' : '#F3F4F6',
                        borderWidth: seniorConfig.avatar === avatar ? 2 : 0,
                        borderColor: '#10B981',
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>{avatar}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Font size */}
              <View
                className="rounded-2xl p-5 mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <View className="flex-row items-center mb-3">
                  <Type size={20} color="#059669" />
                  <Text
                    className="text-gray-700 ml-2"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Taille du texte
                  </Text>
                </View>
                <View className="flex-row">
                  {[
                    { id: 'normal', label: 'Normal' },
                    { id: 'large', label: 'Grand' },
                    { id: 'xlarge', label: 'Très grand' },
                  ].map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSeniorConfig({
                          ...seniorConfig,
                          fontSize: option.id as SeniorConfig['fontSize'],
                        });
                      }}
                      className="flex-1 py-3 rounded-xl mx-1 items-center"
                      style={{
                        backgroundColor:
                          seniorConfig.fontSize === option.id ? '#059669' : '#F3F4F6',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Nunito_600SemiBold',
                          color:
                            seniorConfig.fontSize === option.id ? 'white' : '#6B7280',
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Notifications */}
              <View
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSeniorConfig({
                      ...seniorConfig,
                      notifications: !seniorConfig.notifications,
                    });
                  }}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Bell size={20} color="#059669" />
                    <Text
                      className="text-gray-700 ml-2"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Notifications activées
                    </Text>
                  </View>
                  <View
                    className="w-12 h-7 rounded-full justify-center px-1"
                    style={{
                      backgroundColor: seniorConfig.notifications
                        ? '#10B981'
                        : '#D1D5DB',
                    }}
                  >
                    <View
                      className="w-5 h-5 rounded-full bg-white"
                      style={{
                        alignSelf: seniorConfig.notifications
                          ? 'flex-end'
                          : 'flex-start',
                      }}
                    />
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Step: Code */}
          {currentStep === 'code' && (
            <Animated.View entering={FadeIn.duration(400)} className="pt-8 items-center">
              <Text style={{ fontSize: 64, marginBottom: 16 }}>🔗</Text>
              <Text
                className="text-3xl text-white text-center mb-2"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Votre code de liaison
              </Text>
              <Text
                className="text-base text-white/70 text-center mb-8"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Partagez ce code avec votre proche pour qu'il configure son app
                automatiquement
              </Text>

              {/* Code display */}
              <Animated.View style={pulseStyle}>
                <View
                  className="rounded-3xl p-8 mb-6"
                  style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                >
                  <Text
                    className="text-center tracking-widest"
                    style={{
                      fontFamily: 'Nunito_800ExtraBold',
                      fontSize: 48,
                      color: '#059669',
                      letterSpacing: 12,
                    }}
                  >
                    {linkingCode}
                  </Text>
                </View>
              </Animated.View>

              <Text
                className="text-white/60 text-center mb-6"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Valable 24 heures
              </Text>

              {/* Actions */}
              <View className="flex-row">
                <Pressable
                  onPress={handleCopyCode}
                  className="flex-1 flex-row items-center justify-center py-4 rounded-2xl mx-2 active:scale-95"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {copied ? (
                    <Check size={22} color="white" />
                  ) : (
                    <Copy size={22} color="white" />
                  )}
                  <Text
                    className="text-white ml-2"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleShareCode}
                  className="flex-1 flex-row items-center justify-center py-4 rounded-2xl mx-2 active:scale-95"
                  style={{ backgroundColor: 'white' }}
                >
                  <Share2 size={22} color="#059669" />
                  <Text
                    className="ml-2"
                    style={{ fontFamily: 'Nunito_700Bold', color: '#059669' }}
                  >
                    Partager
                  </Text>
                </Pressable>
              </View>

              {/* Instructions */}
              <View
                className="mt-8 p-5 rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Text
                  className="text-white text-center mb-4"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Instructions pour votre proche :
                </Text>
                <View className="space-y-3">
                  {[
                    '1. Télécharger MonAdmin',
                    '2. Choisir "J\'ai un code"',
                    '3. Entrer le code ci-dessus',
                  ].map((instruction, i) => (
                    <Text
                      key={i}
                      className="text-white/80"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {instruction}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Step: Waiting */}
          {currentStep === 'waiting' && (
            <Animated.View entering={FadeIn.duration(400)} className="pt-8 items-center">
              {isLinked ? (
                <>
                  <Text style={{ fontSize: 80, marginBottom: 16 }}>🎉</Text>
                  <Text
                    className="text-3xl text-white text-center mb-4"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    C'est fait !
                  </Text>
                  <Text
                    className="text-lg text-white/80 text-center mb-8 px-4"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {seniorConfig.prenom || 'Votre proche'} a configuré son app
                    avec succès. Vous êtes maintenant connectés !
                  </Text>
                </>
              ) : (
                <>
                  <Animated.View style={pulseStyle}>
                    <View
                      className="w-32 h-32 rounded-full items-center justify-center mb-8"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <RefreshCw size={48} color="white" />
                    </View>
                  </Animated.View>
                  <Text
                    className="text-3xl text-white text-center mb-4"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    En attente...
                  </Text>
                  <Text
                    className="text-lg text-white/80 text-center mb-4 px-4"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Attendez que {seniorConfig.prenom || 'votre proche'} entre le
                    code sur son téléphone
                  </Text>
                  <View
                    className="rounded-2xl px-6 py-4 mb-8"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text
                      className="text-white text-2xl text-center tracking-widest"
                      style={{ fontFamily: 'Nunito_700Bold', letterSpacing: 8 }}
                    >
                      {linkingCode}
                    </Text>
                  </View>
                  <ActivityIndicator size="large" color="white" />
                </>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Navigation button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleNext}
            disabled={
              isLoading ||
              (currentStep === 'info' && !helperName.trim()) ||
              (currentStep === 'waiting' && !isLinked)
            }
            className="rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
            style={{
              backgroundColor:
                isLoading ||
                (currentStep === 'info' && !helperName.trim()) ||
                (currentStep === 'waiting' && !isLinked)
                  ? 'rgba(255,255,255,0.3)'
                  : 'white',
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#059669" />
            ) : (
              <>
                <Text
                  className="text-lg mr-2"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    color:
                      (currentStep === 'info' && !helperName.trim()) ||
                      (currentStep === 'waiting' && !isLinked)
                        ? 'rgba(255,255,255,0.5)'
                        : '#059669',
                  }}
                >
                  {currentStep === 'code'
                    ? 'J\'ai partagé le code'
                    : currentStep === 'waiting'
                    ? isLinked
                      ? 'Terminé !'
                      : 'En attente...'
                    : 'Continuer'}
                </Text>
                {currentStep !== 'waiting' && (
                  <ChevronRight
                    size={22}
                    color={
                      currentStep === 'info' && !helperName.trim()
                        ? 'rgba(255,255,255,0.5)'
                        : '#059669'
                    }
                  />
                )}
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
