import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Bell, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSettingsStore } from '@/lib/state/settings-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'name' | 'camera' | 'notifications' | 'tutorial' | 'ready';

const TUTORIAL_SLIDES = [
  {
    emoji: '📷',
    title: 'Scannez vos courriers',
    description: 'Prenez simplement une photo de votre courrier et MonAdmin le comprendra pour vous.',
    color: '#2563EB',
  },
  {
    emoji: '💬',
    title: 'Explications simples',
    description: "Fini le jargon administratif ! MonAdmin vous explique tout en mots simples.",
    color: '#10B981',
  },
  {
    emoji: '🎤',
    title: 'Parlez-lui !',
    description: 'Posez vos questions à voix haute. MonAdmin vous répond et vous guide.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👵');
  const [tutorialIndex, setTutorialIndex] = useState(0);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  
  const settings = useSettingsStore();
  
  // Animations
  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  
  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
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

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('name');
        break;
      case 'name':
        if (userName.trim()) {
          settings.updateProfile({ prenom: userName.trim(), avatar: selectedAvatar });
          setCurrentStep('camera');
        }
        break;
      case 'camera':
        setCurrentStep('notifications');
        break;
      case 'notifications':
        setCurrentStep('tutorial');
        break;
      case 'tutorial':
        if (tutorialIndex < TUTORIAL_SLIDES.length - 1) {
          setTutorialIndex(tutorialIndex + 1);
        } else {
          setCurrentStep('ready');
        }
        break;
      case 'ready':
        finishOnboarding();
        break;
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (currentStep) {
      case 'name':
        setCurrentStep('welcome');
        break;
      case 'camera':
        setCurrentStep('name');
        break;
      case 'notifications':
        setCurrentStep('camera');
        break;
      case 'tutorial':
        if (tutorialIndex > 0) {
          setTutorialIndex(tutorialIndex - 1);
        } else {
          setCurrentStep('notifications');
        }
        break;
    }
  };

  const handleRequestCameraPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestCameraPermission();
  };

  const handleRequestNotificationPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status === 'granted');
  };

  const finishOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    settings.completeOnboarding();
    router.replace('/(tabs)');
  };

  const skipOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    settings.completeOnboarding();
    router.replace('/(tabs)');
  };

  const getStepIndex = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'camera', 'notifications', 'tutorial', 'ready'];
    return steps.indexOf(currentStep);
  };

  const totalSteps = 6;
  const progress = ((getStepIndex() + 1) / totalSteps) * 100;

  return (
    <LinearGradient
      colors={
        currentStep === 'tutorial' 
          ? [TUTORIAL_SLIDES[tutorialIndex].color, '#1E3A8A'] 
          : ['#1E40AF', '#2563EB', '#3B82F6']
      }
      style={{ flex: 1 }}
    >
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

        {/* Skip button */}
        {currentStep !== 'ready' && (
          <View className="px-6 pt-4 flex-row justify-end">
            <Pressable onPress={skipOnboarding} className="active:opacity-70">
              <Text
                className="text-white/70 text-base"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Passer
              </Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 px-6 justify-center">
          {currentStep === 'welcome' && <WelcomeStep floatStyle={floatStyle} />}
          {currentStep === 'name' && (
            <NameStep
              userName={userName}
              setUserName={setUserName}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
            />
          )}
          {currentStep === 'camera' && (
            <PermissionStep
              type="camera"
              granted={cameraPermission?.granted || false}
              onRequest={handleRequestCameraPermission}
              pulseStyle={pulseStyle}
            />
          )}
          {currentStep === 'notifications' && (
            <PermissionStep
              type="notifications"
              granted={notificationPermission || false}
              onRequest={handleRequestNotificationPermission}
              pulseStyle={pulseStyle}
            />
          )}
          {currentStep === 'tutorial' && (
            <TutorialStep slide={TUTORIAL_SLIDES[tutorialIndex]} index={tutorialIndex} />
          )}
          {currentStep === 'ready' && <ReadyStep userName={userName || settings.profile.prenom} floatStyle={floatStyle} />}
        </View>

        {/* Navigation buttons */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between">
            {/* Back button */}
            {currentStep !== 'welcome' && currentStep !== 'ready' ? (
              <Pressable
                onPress={handleBack}
                className="w-14 h-14 rounded-full items-center justify-center active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <ChevronLeft size={28} color="white" />
              </Pressable>
            ) : (
              <View className="w-14" />
            )}

            {/* Dots indicator for tutorial */}
            {currentStep === 'tutorial' && (
              <View className="flex-row items-center space-x-2">
                {TUTORIAL_SLIDES.map((_, i) => (
                  <View
                    key={i}
                    className="rounded-full"
                    style={{
                      width: i === tutorialIndex ? 24 : 8,
                      height: 8,
                      backgroundColor: i === tutorialIndex ? 'white' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </View>
            )}

            {/* Next button */}
            <Pressable
              onPress={handleNext}
              disabled={currentStep === 'name' && !userName.trim()}
              className="rounded-full flex-row items-center justify-center active:scale-95"
              style={{
                backgroundColor: (currentStep === 'name' && !userName.trim()) 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'white',
                paddingHorizontal: currentStep === 'ready' ? 32 : 24,
                paddingVertical: 16,
                minWidth: currentStep === 'ready' ? 200 : undefined,
              }}
            >
              <Text
                className="text-lg mr-2"
                style={{
                  fontFamily: 'Nunito_700Bold',
                  color: currentStep === 'tutorial' ? TUTORIAL_SLIDES[tutorialIndex].color : '#1E40AF',
                }}
              >
                {currentStep === 'ready' ? 'Commencer !' : 'Suivant'}
              </Text>
              {currentStep !== 'ready' && (
                <ChevronRight 
                  size={22} 
                  color={currentStep === 'tutorial' ? TUTORIAL_SLIDES[tutorialIndex].color : '#1E40AF'} 
                />
              )}
              {currentStep === 'ready' && (
                <Sparkles size={22} color="#1E40AF" />
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Step Components
function WelcomeStep({ floatStyle }: { floatStyle: any }) {
  return (
    <Animated.View 
      entering={FadeIn.duration(600)}
      className="items-center"
    >
      <Animated.View style={floatStyle}>
        <View
          className="w-40 h-40 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Text style={{ fontSize: 80 }}>📱</Text>
        </View>
      </Animated.View>
      
      <Text
        className="text-5xl text-white text-center mb-4"
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
      >
        Bienvenue !
      </Text>
      
      <Text
        className="text-xl text-white/90 text-center mb-6"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        MonAdmin
      </Text>
      
      <Text
        className="text-lg text-white/70 text-center leading-7 px-4"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        Votre assistant personnel pour comprendre et gérer vos courriers administratifs en toute simplicité.
      </Text>
    </Animated.View>
  );
}

function NameStep({
  userName,
  setUserName,
  selectedAvatar,
  setSelectedAvatar,
}: {
  userName: string;
  setUserName: (name: string) => void;
  selectedAvatar: string;
  setSelectedAvatar: (avatar: string) => void;
}) {
  const avatars = ['👵', '👴', '🧓', '👩‍🦳', '👨‍🦳', '😊', '🙂', '😄'];

  return (
    <Animated.View 
      entering={SlideInRight.duration(400)}
      className="items-center"
    >
      <Text style={{ fontSize: 64, marginBottom: 16 }}>👋</Text>
      
      <Text
        className="text-3xl text-white text-center mb-3"
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
      >
        Comment vous appelez-vous ?
      </Text>
      
      <Text
        className="text-lg text-white/70 text-center mb-8"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        Pour que je puisse vous saluer !
      </Text>

      {/* Name input */}
      <View
        className="w-full rounded-2xl px-6 py-5 mb-8"
        style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
      >
        <TextInput
          value={userName}
          onChangeText={setUserName}
          placeholder="Votre prénom"
          placeholderTextColor="#9CA3AF"
          className="text-2xl text-center"
          style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}
          autoFocus
        />
      </View>

      {/* Avatar selection */}
      <Text
        className="text-base text-white/70 mb-4"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        Choisissez votre avatar
      </Text>
      
      <View className="flex-row flex-wrap justify-center">
        {avatars.map((avatar) => (
          <Pressable
            key={avatar}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedAvatar(avatar);
            }}
            className="m-2 w-16 h-16 rounded-full items-center justify-center"
            style={{
              backgroundColor: selectedAvatar === avatar 
                ? 'rgba(255,255,255,0.95)' 
                : 'rgba(255,255,255,0.2)',
              borderWidth: selectedAvatar === avatar ? 3 : 0,
              borderColor: '#FEF3C7',
            }}
          >
            <Text style={{ fontSize: 32 }}>{avatar}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

function PermissionStep({
  type,
  granted,
  onRequest,
  pulseStyle,
}: {
  type: 'camera' | 'notifications';
  granted: boolean;
  onRequest: () => void;
  pulseStyle: any;
}) {
  const config = {
    camera: {
      emoji: '📷',
      title: 'Autoriser la caméra',
      description: 'Pour scanner vos courriers, MonAdmin a besoin d\'accéder à votre caméra.',
      icon: Camera,
    },
    notifications: {
      emoji: '🔔',
      title: 'Activer les notifications',
      description: 'Pour ne jamais oublier une date limite importante, autorisez les rappels.',
      icon: Bell,
    },
  };

  const { emoji, title, description, icon: Icon } = config[type];

  return (
    <Animated.View 
      entering={SlideInRight.duration(400)}
      className="items-center"
    >
      <Animated.View style={pulseStyle}>
        <View
          className="w-36 h-36 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: granted ? '#10B981' : 'rgba(255,255,255,0.15)' }}
        >
          {granted ? (
            <Check size={64} color="white" />
          ) : (
            <Text style={{ fontSize: 64 }}>{emoji}</Text>
          )}
        </View>
      </Animated.View>
      
      <Text
        className="text-3xl text-white text-center mb-3"
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
      >
        {granted ? 'C\'est fait !' : title}
      </Text>
      
      <Text
        className="text-lg text-white/70 text-center mb-8 px-4 leading-7"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        {granted 
          ? `La ${type === 'camera' ? 'caméra' : 'notification'} est maintenant activée.`
          : description
        }
      </Text>

      {!granted && (
        <Pressable
          onPress={onRequest}
          className="rounded-2xl px-8 py-4 flex-row items-center active:scale-95"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
        >
          <Icon size={24} color="#1E40AF" />
          <Text
            className="text-lg ml-3"
            style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}
          >
            Autoriser
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function TutorialStep({ slide, index }: { slide: typeof TUTORIAL_SLIDES[0]; index: number }) {
  return (
    <Animated.View 
      key={index}
      entering={SlideInRight.duration(400)}
      exiting={SlideOutLeft.duration(300)}
      className="items-center"
    >
      <View
        className="w-40 h-40 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
      >
        <Text style={{ fontSize: 72 }}>{slide.emoji}</Text>
      </View>
      
      <Text
        className="text-3xl text-white text-center mb-4"
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
      >
        {slide.title}
      </Text>
      
      <Text
        className="text-lg text-white/80 text-center px-4 leading-7"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        {slide.description}
      </Text>
    </Animated.View>
  );
}

function ReadyStep({ userName, floatStyle }: { userName: string; floatStyle: any }) {
  return (
    <Animated.View 
      entering={FadeIn.duration(600)}
      className="items-center"
    >
      <Animated.View style={floatStyle}>
        <View
          className="w-44 h-44 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={{ fontSize: 80 }}>🎉</Text>
        </View>
      </Animated.View>
      
      <Text
        className="text-4xl text-white text-center mb-4"
        style={{ fontFamily: 'Nunito_800ExtraBold' }}
      >
        Tout est prêt, {userName} !
      </Text>
      
      <Text
        className="text-lg text-white/80 text-center px-4 leading-7"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        MonAdmin est maintenant configuré et prêt à vous aider avec vos courriers administratifs.
      </Text>

      <View className="mt-8 flex-row items-center">
        <Sparkles size={20} color="rgba(255,255,255,0.6)" />
        <Text
          className="text-base text-white/60 ml-2"
          style={{ fontFamily: 'Nunito_400Regular' }}
        >
          Scannez votre premier courrier !
        </Text>
      </View>
    </Animated.View>
  );
}
