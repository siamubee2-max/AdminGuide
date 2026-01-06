import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Mic, FolderOpen, HelpCircle, Phone, Settings } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';

export default function HomeScreen() {
  const router = useRouter();
  const userName = useDocumentStore((s) => s.user.name);
  const documents = useDocumentStore((s) => s.documents);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return "Bon après-midi";
    return 'Bonsoir';
  }, []);

  const urgentCount = documents.filter((d) => d.urgence === 'rouge').length;
  const pendingCount = documents.length;

  const quickHelpItems = [
    { icon: HelpCircle, label: 'Comment ça marche ?', emoji: '❓' },
    { icon: Phone, label: 'Appeler un aidant', emoji: '📞' },
    { icon: Settings, label: 'Réglages', emoji: '⚙️' },
  ];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#E3F2FD', '#FFFFFF']}
        locations={[0, 0.3]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Avatar */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            className="items-center pt-8 pb-6"
          >
            <LinearGradient
              colors={['#1565C0', '#0D47A1']}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 4,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 56 }}>👴</Text>
            </LinearGradient>
            <Text
              className="text-3xl text-text-primary mt-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {greeting} {userName} !
            </Text>
            <Text
              className="text-xl text-text-secondary mt-2"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Comment puis-je vous aider ?
            </Text>
          </Animated.View>

          {/* Alert Banner */}
          {pendingCount > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(200)}
              className="mx-6 mb-6"
            >
              <Pressable
                onPress={() => router.push('/(tabs)/documents')}
                className="bg-warning-light rounded-2xl p-5 flex-row items-center active:opacity-80"
                style={{ borderWidth: 3, borderColor: '#FFB74D' }}
              >
                <Text style={{ fontSize: 32 }}>⚠️</Text>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-lg text-warning"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {pendingCount} courrier(s) à traiter
                  </Text>
                  {urgentCount > 0 && (
                    <Text
                      className="text-base text-warning/80"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      Dont {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Main Action Buttons */}
          <View className="px-6 space-y-5">
            <Animated.View entering={FadeInUp.duration(500).delay(300)}>
              <Pressable
                onPress={() => router.push('/(tabs)/scanner')}
                className="bg-primary rounded-2xl p-6 flex-row items-center active:opacity-90"
                style={{
                  minHeight: 72,
                  shadowColor: '#1565C0',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
                  <Camera size={28} color="white" strokeWidth={2} />
                </View>
                <Text
                  className="text-xl text-white ml-5 flex-1"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Scanner un courrier
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(400)}>
              <Pressable
                onPress={() => router.push('/vocal')}
                className="bg-white rounded-2xl p-6 flex-row items-center active:opacity-90"
                style={{
                  minHeight: 72,
                  borderWidth: 2,
                  borderColor: '#E8EAF6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                  <Mic size={28} color="#1565C0" strokeWidth={2} />
                </View>
                <Text
                  className="text-xl text-text-primary ml-5 flex-1"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Parler à MonAdmin
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(500)}>
              <Pressable
                onPress={() => router.push('/(tabs)/documents')}
                className="bg-white rounded-2xl p-6 flex-row items-center active:opacity-90"
                style={{
                  minHeight: 72,
                  borderWidth: 2,
                  borderColor: '#E8EAF6',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                  <FolderOpen size={28} color="#1565C0" strokeWidth={2} />
                </View>
                <Text
                  className="text-xl text-text-primary ml-5 flex-1"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Mes documents
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Quick Help Section */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(600)}
            className="mt-8"
          >
            <Text
              className="text-xl text-text-primary px-6 mb-4"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              💡 Aide rapide
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              style={{ flexGrow: 0 }}
            >
              {quickHelpItems.map((item, index) => (
                <Pressable
                  key={index}
                  className="bg-white rounded-2xl p-5 items-center active:opacity-80"
                  style={{
                    width: 130,
                    borderWidth: 2,
                    borderColor: '#E8EAF6',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</Text>
                  <Text
                    className="text-base text-text-primary text-center"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
