import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, Heart, ChevronRight, Sparkles } from 'lucide-react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingChoiceScreen() {
  const router = useRouter();

  // Animations
  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const handleSeniorMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding');
  };

  const handleHelperMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-helper');
  };

  const handleSeniorWithCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding-senior-code');
  };

  return (
    <LinearGradient
      colors={['#1E40AF', '#2563EB', '#3B82F6']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center pt-12 pb-8"
        >
          <Animated.View style={floatStyle}>
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text style={{ fontSize: 64 }}>📱</Text>
            </View>
          </Animated.View>

          <Text
            className="text-4xl text-white text-center mb-2"
            style={{ fontFamily: 'Nunito_800ExtraBold' }}
          >
            Bienvenue !
          </Text>

          <Text
            className="text-xl text-white/80 text-center px-8"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            Comment souhaitez-vous configurer MonAdmin ?
          </Text>
        </Animated.View>

        {/* Options */}
        <View className="flex-1 px-6 justify-center">
          {/* Option 1: Senior seul */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Pressable
              onPress={handleSeniorMode}
              className="rounded-3xl p-6 mb-4 active:scale-[0.98]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: '#DBEAFE' }}
                >
                  <User size={32} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xl text-gray-900 mb-1"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Je configure moi-même
                  </Text>
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Configuration classique pas à pas
                  </Text>
                </View>
                <ChevronRight size={24} color="#9CA3AF" />
              </View>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeIn.duration(400).delay(300)}
            className="flex-row items-center my-4 px-4"
          >
            <View className="flex-1 h-px bg-white/20" />
            <Text
              className="text-white/60 mx-4 text-sm"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              ou
            </Text>
            <View className="flex-1 h-px bg-white/20" />
          </Animated.View>

          {/* Option 2: Avec code d'un aidant */}
          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <Pressable
              onPress={handleSeniorWithCode}
              className="rounded-3xl p-6 mb-4 active:scale-[0.98]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: '#D1FAE5' }}
                >
                  <Text style={{ fontSize: 28 }}>🔗</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xl text-gray-900 mb-1"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    J'ai un code
                  </Text>
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Un proche a préparé l'app pour moi
                  </Text>
                </View>
                <ChevronRight size={24} color="#9CA3AF" />
              </View>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeIn.duration(400).delay(500)}
            className="flex-row items-center my-4 px-4"
          >
            <View className="flex-1 h-px bg-white/20" />
            <Text
              className="text-white/60 mx-4 text-sm"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              pour les aidants
            </Text>
            <View className="flex-1 h-px bg-white/20" />
          </Animated.View>

          {/* Option 3: Helper mode */}
          <Animated.View entering={FadeInUp.duration(500).delay(600)}>
            <Pressable
              onPress={handleHelperMode}
              className="rounded-3xl p-6 active:scale-[0.98] overflow-hidden"
              style={{
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Heart size={32} color="white" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text
                      className="text-xl text-white mr-2"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Je suis un aidant
                    </Text>
                    <Sparkles size={16} color="#FEF3C7" />
                  </View>
                  <Text
                    className="text-sm text-white/70"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Configurer l'app pour un proche
                  </Text>
                </View>
                <ChevronRight size={24} color="rgba(255,255,255,0.6)" />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.duration(400).delay(700)}
          className="px-6 pb-8"
        >
          <Text
            className="text-white/50 text-center text-sm"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            MonAdmin simplifie vos courriers administratifs
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
