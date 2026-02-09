import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSettingsStore } from '@/lib/state/settings-store';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const modeSombre = useSettingsStore((s) => s.modeSombre);

  useEffect(() => {
    async function prepare() {
      try {
        // Load settings from storage
        await loadSettings();
      } catch (e) {
        console.warn('Error loading settings:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === 'onboarding' ||
                         segments[0] === 'onboarding-choice' ||
                         segments[0] === 'onboarding-helper' ||
                         segments[0] === 'onboarding-senior-code';

    if (!onboardingComplete && !inOnboarding) {
      // Redirect to onboarding choice screen if not completed
      router.replace('/onboarding-choice');
    } else if (onboardingComplete && inOnboarding) {
      // Redirect to home if onboarding is complete
      router.replace('/(tabs)');
    }
  }, [isReady, onboardingComplete, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <ThemeProvider value={modeSombre ? DarkTheme : DefaultTheme}>
      <StatusBar style={modeSombre ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="onboarding-choice"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="onboarding-helper"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="onboarding-senior-code"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="resultat"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="vocal"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="reglages"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="historique"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="famille"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="confidentialite"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="cgu"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="faq"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="premium"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="pro-b2b"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="confiance"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
