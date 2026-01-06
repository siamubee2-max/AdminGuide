import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mic, Square } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

type VoiceState = 'idle' | 'listening';

export default function VocalScreen() {
  const router = useRouter();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  const avatarScale = useSharedValue(1);

  useEffect(() => {
    if (voiceState === 'listening') {
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1000, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.3, { duration: 300 });
      avatarScale.value = withTiming(1, { duration: 300 });
    }
  }, [voiceState]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const toggleListening = () => {
    setVoiceState((prev) => (prev === 'idle' ? 'listening' : 'idle'));
  };

  const examples = [
    '"Lis-moi mon dernier courrier"',
    '"Où est ma facture EDF ?"',
    '"Qu\'est-ce que je dois faire cette semaine ?"',
  ];

  return (
    <LinearGradient
      colors={['#1565C0', '#0D47A1']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={28} color="white" />
            <Text
              className="text-white text-lg ml-2"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Retour
            </Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-8">
          {/* Avatar with Pulse Effect */}
          <View className="items-center mb-12">
            {/* Pulse Ring */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: voiceState === 'listening' ? '#4CAF50' : '#FFFFFF',
                },
                pulseStyle,
              ]}
            />

            {/* Avatar */}
            <Animated.View style={avatarAnimatedStyle}>
              <LinearGradient
                colors={
                  voiceState === 'listening'
                    ? ['#4CAF50', '#2E7D32']
                    : ['#FFFFFF', '#E3F2FD']
                }
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Text style={{ fontSize: 80 }}>
                  {voiceState === 'listening' ? '👂' : '🤖'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Status Text */}
          <Animated.View entering={FadeInDown.duration(400)} className="items-center mb-8">
            <Text
              className="text-3xl text-white text-center"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {voiceState === 'listening' ? 'Je vous écoute...' : 'Parler à MonAdmin'}
            </Text>
            {voiceState === 'idle' && (
              <Text
                className="text-lg text-white/80 text-center mt-3"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Appuyez sur le micro et posez votre question
              </Text>
            )}
          </Animated.View>

          {/* Examples */}
          {voiceState === 'idle' && (
            <Animated.View
              entering={FadeIn.duration(400).delay(200)}
              className="w-full bg-white/10 rounded-3xl p-6 mb-8"
            >
              <Text
                className="text-white/80 text-base mb-4"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Exemples de questions :
              </Text>
              {examples.map((example, index) => (
                <Text
                  key={index}
                  className="text-white text-lg mb-2"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {example}
                </Text>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Mic Button */}
        <View className="items-center pb-12">
          <Pressable
            onPress={toggleListening}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: voiceState === 'listening' ? '#F44336' : '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: voiceState === 'listening' ? '#F44336' : '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {voiceState === 'listening' ? (
              <Square size={36} color="white" fill="white" />
            ) : (
              <Mic size={40} color="#1565C0" strokeWidth={2.5} />
            )}
          </Pressable>
          <Text
            className="text-white/80 text-base mt-4"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {voiceState === 'listening' ? 'Appuyez pour arrêter' : 'Appuyez pour parler'}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
