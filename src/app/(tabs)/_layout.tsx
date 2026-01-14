import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Camera, FolderOpen } from 'lucide-react-native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: insets.bottom + 10,
          height: 76 + insets.bottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
          elevation: 20,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontFamily: 'Nunito_700Bold',
          fontSize: 12,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <View 
              className={`px-4 py-2 rounded-2xl`}
              style={{ 
                backgroundColor: focused ? '#EFF6FF' : 'transparent',
              }}
            >
              <Home 
                size={26} 
                color={focused ? '#2563EB' : '#9CA3AF'} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <View 
              className={`px-4 py-2 rounded-2xl`}
              style={{ 
                backgroundColor: focused ? '#FEF3C7' : 'transparent',
              }}
            >
              <Camera 
                size={26} 
                color={focused ? '#D97706' : '#9CA3AF'} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
          tabBarActiveTintColor: '#D97706',
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, focused }) => (
            <View 
              className={`px-4 py-2 rounded-2xl`}
              style={{ 
                backgroundColor: focused ? '#F5F3FF' : 'transparent',
              }}
            >
              <FolderOpen 
                size={26} 
                color={focused ? '#7C3AED' : '#9CA3AF'} 
                strokeWidth={focused ? 2.5 : 2} 
              />
            </View>
          ),
          tabBarActiveTintColor: '#7C3AED',
        }}
      />
    </Tabs>
  );
}
