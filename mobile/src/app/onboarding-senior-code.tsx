import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSettingsStore, FontSize } from '@/lib/state/settings-store';
import * as Device from 'expo-device';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

export default function OnboardingSeniorCodeScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [helperName, setHelperName] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animations
  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value.replace(/\D/g, '');
      setCode(newCode);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Code incomplet', 'Veuillez entrer les 6 chiffres du code.');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const deviceId = Device.deviceName || `device_${Date.now()}`;
      const response = await fetch(`${BACKEND_URL}/api/linking/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          seniorDeviceId: deviceId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHelperName(data.helperName);
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Apply configuration
        if (data.seniorConfig) {
          const config = data.seniorConfig;

          // Update profile
          settings.updateProfile({
            prenom: config.prenom || 'Utilisateur',
            avatar: config.avatar || '👵',
          });

          // Update font size
          if (config.fontSize) {
            const fontSizeMap: Record<string, FontSize> = {
              normal: 'normal',
              large: 'grand',
              xlarge: 'tres_grand',
            };
            settings.setTaillePolice(fontSizeMap[config.fontSize] || 'normal');
          }

          // Update notifications
          if (config.notifications !== undefined) {
            if (config.notifications && !settings.notificationsActives) {
              settings.toggleNotifications();
            } else if (!config.notifications && settings.notificationsActives) {
              settings.toggleNotifications();
            }
          }

          // Add helper as aidant
          if (data.helperName) {
            settings.addAidant({
              prenom: data.helperName,
              nom: '',
              telephone: data.helperPhone || '',
              email: '',
              relation: 'Aidant',
              notificationsUrgentes: true,
            });
          }
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (response.status === 404) {
          Alert.alert('Code invalide', 'Ce code n\'existe pas. Vérifiez auprès de votre proche.');
        } else if (response.status === 410) {
          Alert.alert('Code expiré', 'Ce code a expiré. Demandez un nouveau code à votre proche.');
        } else {
          Alert.alert('Erreur', data.error || 'Une erreur est survenue.');
        }
      }
    } catch (error) {
      console.error('Error validating code:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur de connexion', 'Vérifiez votre connexion internet et réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    settings.completeOnboarding();
    router.replace('/(tabs)');
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <LinearGradient
      colors={isSuccess ? ['#059669', '#10B981', '#34D399'] : ['#1E40AF', '#2563EB', '#3B82F6']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Back button */}
        {!isSuccess && (
          <View className="px-6 pt-4">
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
          </View>
        )}

        <View className="flex-1 px-6 justify-center">
          {!isSuccess ? (
            <Animated.View entering={FadeIn.duration(400)} className="items-center">
              <Animated.View style={floatStyle}>
                <View
                  className="w-32 h-32 rounded-full items-center justify-center mb-8"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  <Text style={{ fontSize: 64 }}>🔗</Text>
                </View>
              </Animated.View>

              <Text
                className="text-3xl text-white text-center mb-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Entrez le code
              </Text>

              <Text
                className="text-lg text-white/70 text-center mb-8 px-4"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Votre proche vous a donné un code à 6 chiffres
              </Text>

              {/* Code input */}
              <View className="flex-row justify-center mb-8">
                {code.map((digit, index) => (
                  <View key={index} className="mx-1.5">
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(index, value)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(index, nativeEvent.key)
                      }
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                      className="w-14 h-16 rounded-2xl text-center"
                      style={{
                        backgroundColor: digit ? 'white' : 'rgba(255,255,255,0.9)',
                        fontFamily: 'Nunito_800ExtraBold',
                        fontSize: 28,
                        color: '#1E40AF',
                        borderWidth: digit ? 3 : 0,
                        borderColor: '#FEF3C7',
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Validate button */}
              <Pressable
                onPress={validateCode}
                disabled={!isCodeComplete || isLoading}
                className="w-full rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
                style={{
                  backgroundColor: isCodeComplete ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1E40AF" />
                ) : (
                  <>
                    <Text
                      className="text-xl mr-2"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        color: isCodeComplete ? '#1E40AF' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      Valider le code
                    </Text>
                    <Check
                      size={24}
                      color={isCodeComplete ? '#1E40AF' : 'rgba(255,255,255,0.5)'}
                    />
                  </>
                )}
              </Pressable>

              {/* Help text */}
              <View className="mt-8 p-5 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Text
                  className="text-white/80 text-center"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Votre proche a préparé l'application pour vous. Ce code configure automatiquement l'app avec vos préférences.
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(600)} className="items-center">
              <Animated.View style={pulseStyle}>
                <View
                  className="w-40 h-40 rounded-full items-center justify-center mb-8"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={{ fontSize: 80 }}>🎉</Text>
                </View>
              </Animated.View>

              <Text
                className="text-4xl text-white text-center mb-4"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Bienvenue !
              </Text>

              <Text
                className="text-xl text-white/90 text-center mb-2"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {settings.profile.prenom}
              </Text>

              <Text
                className="text-lg text-white/70 text-center mb-8 px-4"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {helperName} a configuré l'application pour vous. Tout est prêt !
              </Text>

              <View className="flex-row items-center mb-8">
                <Sparkles size={20} color="rgba(255,255,255,0.6)" />
                <Text
                  className="text-base text-white/60 ml-2"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  L'app est configurée sur mesure
                </Text>
              </View>

              <Pressable
                onPress={handleFinish}
                className="w-full rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
                style={{ backgroundColor: 'white' }}
              >
                <Text
                  className="text-xl mr-2"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#059669' }}
                >
                  Commencer !
                </Text>
                <Sparkles size={24} color="#059669" />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
