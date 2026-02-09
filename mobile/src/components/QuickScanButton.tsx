import React, { useEffect } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { usePremium } from '@/lib/hooks/usePremium';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

interface QuickScanButtonProps {
  /**
   * Position of the button on screen
   */
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  /**
   * Bottom offset from screen edge
   */
  bottomOffset?: number;
  /**
   * Whether to show the label text
   */
  showLabel?: boolean;
  /**
   * Custom label text
   */
  label?: string;
  /**
   * Size of the button ('small' | 'medium' | 'large')
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Optional callback before navigation
   */
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickScanButton({
  position = 'bottom-right',
  bottomOffset = 100,
  showLabel = true,
  label = 'Scanner',
  size = 'large',
  onPress,
}: QuickScanButtonProps) {
  const router = useRouter();
  const display = useDisplaySettings();
  const { isPremium, requirePremium } = usePremium();

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const pressScale = useSharedValue(1);

  // Pulse animation
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * pressScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pressScale.value = withSpring(0.9, { damping: 15 }, () => {
      pressScale.value = withSpring(1, { damping: 15 });
    });

    if (onPress) {
      onPress();
    }

    if (!isPremium) {
      requirePremium();
    } else {
      router.push('/(tabs)/scanner');
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { button: 56, icon: 24, label: 12, glow: 70 },
    medium: { button: 68, icon: 28, label: 14, glow: 84 },
    large: { button: 80, icon: 34, label: 16, glow: 100 },
  };

  const currentSize = sizeConfig[size];

  // Position styles
  const positionStyle = {
    'bottom-right': { right: 24, alignItems: 'flex-end' as const },
    'bottom-center': { left: 0, right: 0, alignItems: 'center' as const },
    'bottom-left': { left: 24, alignItems: 'flex-start' as const },
  };

  return (
    <View
      style={[
        styles.container,
        positionStyle[position],
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[styles.buttonWrapper, containerStyle]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            {
              width: currentSize.glow,
              height: currentSize.glow,
              borderRadius: currentSize.glow / 2,
            },
          ]}
        />

        {/* Main button */}
        <View
          style={[
            styles.buttonOuter,
            {
              width: currentSize.button,
              height: currentSize.button,
              borderRadius: currentSize.button / 2,
            },
          ]}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8', '#1E40AF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.buttonGradient,
              {
                width: currentSize.button,
                height: currentSize.button,
                borderRadius: currentSize.button / 2,
              },
            ]}
          >
            <Camera size={currentSize.icon} color="white" strokeWidth={2.5} />
          </LinearGradient>
        </View>

        {/* Premium indicator */}
        {!isPremium && (
          <View style={styles.premiumBadge}>
            <Sparkles size={12} color="#F59E0B" />
          </View>
        )}
      </AnimatedPressable>

      {/* Label */}
      {showLabel && (
        <Animated.Text
          style={[
            styles.label,
            {
              fontSize: currentSize.label,
              fontFamily: 'Nunito_700Bold',
              color: display.colors.text,
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#3B82F6',
  },
  buttonOuter: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
