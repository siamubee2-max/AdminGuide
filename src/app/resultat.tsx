import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Volume2, VolumeX, PenLine, Clock, FolderOpen } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { useDocumentStore } from '@/lib/state/document-store';
import { URGENCE_STYLES } from '@/lib/types';

export default function ResultatScreen() {
  const router = useRouter();
  const currentDocument = useDocumentStore((s) => s.currentDocument);
  const archiveDocument = useDocumentStore((s) => s.archiveDocument);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!currentDocument) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📄</Text>
        <Text
          className="text-xl text-text-primary"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Aucun document sélectionné
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-primary rounded-2xl px-8 py-4"
        >
          <Text
            className="text-white text-lg"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  const urgenceStyle = URGENCE_STYLES[currentDocument.urgence];

  const handleReadAloud = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToRead = `${currentDocument.titre}. ${currentDocument.explication}. Ce que vous devez faire: ${currentDocument.action}`;
      Speech.speak(textToRead, {
        language: 'fr-FR',
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const handleArchive = () => {
    archiveDocument(currentDocument.id);
    router.replace('/(tabs)/documents');
  };

  const handleSetReminder = () => {
    Alert.alert(
      'Rappel créé',
      'Vous serez rappelé pour ce document.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4 flex-row items-center justify-between"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={28} color="#1A237E" />
            <Text
              className="text-text-primary text-lg ml-1"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Retour
            </Text>
          </Pressable>
          <Pressable
            onPress={handleReadAloud}
            className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center"
          >
            {isSpeaking ? (
              <VolumeX size={28} color="#1565C0" />
            ) : (
              <Volume2 size={28} color="#1565C0" />
            )}
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Document Card */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="bg-white rounded-3xl p-6 mb-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Badges */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="bg-gray-100 rounded-xl px-4 py-2">
                <Text
                  className="text-text-secondary text-base"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {currentDocument.type}
                </Text>
              </View>
              <View
                className="rounded-xl px-4 py-2 flex-row items-center"
                style={{
                  backgroundColor: urgenceStyle.background,
                  borderWidth: 2,
                  borderColor: urgenceStyle.border,
                }}
              >
                <Text style={{ marginRight: 6 }}>{urgenceStyle.icon}</Text>
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: 16,
                    color: urgenceStyle.text,
                  }}
                >
                  {urgenceStyle.label}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              className="text-2xl text-text-primary mb-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {currentDocument.titre}
            </Text>

            {/* Info Grid */}
            {(currentDocument.montant || currentDocument.dateLimite) && (
              <View className="bg-gray-50 rounded-2xl p-4 mb-5 flex-row">
                {currentDocument.montant && (
                  <View className="flex-1">
                    <Text
                      className="text-text-secondary text-base mb-1"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      💰 Montant
                    </Text>
                    <Text
                      className="text-text-primary text-xl"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {currentDocument.montant}
                    </Text>
                  </View>
                )}
                {currentDocument.dateLimite && (
                  <View className="flex-1">
                    <Text
                      className="text-text-secondary text-base mb-1"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      📅 À faire avant
                    </Text>
                    <Text
                      className="text-text-primary text-xl"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {currentDocument.dateLimite}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Explanation */}
            <View
              className="rounded-2xl p-5"
              style={{
                backgroundColor: '#E3F2FD',
                borderLeftWidth: 6,
                borderLeftColor: '#1565C0',
              }}
            >
              <Text
                className="text-primary text-lg mb-2"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                💬 Ce que ça veut dire
              </Text>
              <Text
                className="text-text-primary text-lg leading-7"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {currentDocument.explication}
              </Text>
            </View>
          </Animated.View>

          {/* Action Card */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="bg-white rounded-3xl p-6 mb-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              className="text-xl text-text-primary mb-4"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              ✅ Ce que vous devez faire
            </Text>
            <View
              className="rounded-2xl p-5"
              style={{
                backgroundColor: '#E8F5E9',
                borderWidth: 3,
                borderColor: '#81C784',
              }}
            >
              <Text
                className="text-lg leading-7"
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  color: '#2E7D32',
                }}
              >
                {currentDocument.action}
              </Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            className="space-y-4"
          >
            <Pressable
              className="bg-primary rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
              style={{
                minHeight: 72,
                shadowColor: '#1565C0',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <PenLine size={24} color="white" />
              <Text
                className="text-xl text-white ml-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                M'aider à répondre
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSetReminder}
              className="bg-warning rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
              style={{
                minHeight: 72,
                shadowColor: '#FF9800',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Clock size={24} color="white" />
              <Text
                className="text-xl text-white ml-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Me rappeler plus tard
              </Text>
            </Pressable>

            <Pressable
              onPress={handleArchive}
              className="bg-white rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
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
              <FolderOpen size={24} color="#1565C0" />
              <Text
                className="text-xl text-primary ml-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Archiver ce document
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
