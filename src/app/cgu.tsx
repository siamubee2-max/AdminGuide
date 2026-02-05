import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

const ARTICLES = [
  {
    number: '1',
    title: "Objet de l'application",
    content:
      "MonAdmin est une application mobile destinee a aider les utilisateurs, notamment les personnes agees, a comprendre et gerer leurs documents administratifs. L'application utilise l'intelligence artificielle pour analyser les courriers et fournir des explications simplifiees.",
  },
  {
    number: '2',
    title: "Acceptation des conditions",
    content:
      "L'utilisation de MonAdmin implique l'acceptation pleine et entiere des presentes Conditions Generales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.",
  },
  {
    number: '3',
    title: "Acces au service",
    content:
      "MonAdmin est accessible gratuitement. L'application necessite un appareil mobile compatible et une connexion internet pour l'analyse des documents par intelligence artificielle. Certaines fonctionnalites (consultation des documents deja analyses, rappels) sont disponibles hors ligne.",
  },
  {
    number: '4',
    title: "Utilisation de l'IA",
    content:
      "L'analyse des documents est realisee par des services d'intelligence artificielle tiers (Anthropic, OpenAI). Les resultats fournis sont des suggestions et ne constituent en aucun cas un avis juridique, financier ou medical. MonAdmin ne garantit pas l'exactitude complete des analyses.\n\nIl est recommande de verifier les informations importantes aupres de l'organisme emetteur du document.",
  },
  {
    number: '5',
    title: "Responsabilites de l'utilisateur",
    content:
      "L'utilisateur s'engage a :\n\n- Utiliser l'application conformement a sa destination\n- Ne pas utiliser l'application a des fins illegales\n- Ne pas tenter de contourner les mesures de securite\n- Verifier les informations importantes fournies par l'application aupres des organismes concernes",
  },
  {
    number: '6',
    title: "Limitation de responsabilite",
    content:
      "MonAdmin fournit un service d'aide a la comprehension de documents administratifs. L'application ne se substitue pas aux conseils d'un professionnel (avocat, comptable, conseiller). En aucun cas MonAdmin ne pourra etre tenu responsable des decisions prises sur la base des analyses fournies.",
  },
  {
    number: '7',
    title: "Propriete intellectuelle",
    content:
      "L'ensemble des elements composant l'application MonAdmin (design, textes, logo, code) sont proteges par le droit de la propriete intellectuelle. Toute reproduction non autorisee est interdite.",
  },
  {
    number: '8',
    title: "Modification des conditions",
    content:
      "MonAdmin se reserve le droit de modifier les presentes CGU a tout moment. Les modifications entrent en vigueur des leur publication dans l'application. L'utilisation continue de l'application apres modification vaut acceptation des nouvelles conditions.",
  },
  {
    number: '9',
    title: "Droit applicable",
    content:
      "Les presentes conditions sont regies par le droit francais. En cas de litige, les tribunaux francais seront seuls competents.",
  },
];

export default function CGUScreen() {
  const router = useRouter();
  const display = useDisplaySettings();

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1F2937', '#111827', '#0F172A']
          : ['#FFF7ED', '#FEF3C7', '#FFFFFF']}
        locations={[0, 0.25, 0.6]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-2 flex-row items-center"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center active:opacity-70"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: display.isDarkMode ? '#78350F' : '#FEF3C7' }}
            >
              <ChevronLeft size={24} color="#D97706" />
            </View>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: '#D97706',
              }}
            >
              Retour
            </Text>
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-6 pb-5"
        >
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: display.isDarkMode ? '#78350F' : '#FEF3C7' }}
            >
              <FileText size={28} color="#D97706" />
            </View>
            <View className="ml-4 flex-1">
              <Text
                style={{
                  fontFamily: 'Nunito_800ExtraBold',
                  fontSize: display.fontSize['2xl'],
                  color: display.colors.text,
                }}
              >
                Conditions Generales d'Utilisation
              </Text>
              <Text
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.sm,
                  color: display.colors.textMuted,
                  marginTop: 2,
                }}
              >
                Derniere mise a jour : fevrier 2026
              </Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Articles */}
          {ARTICLES.map((article, index) => (
            <Animated.View
              key={article.number}
              entering={FadeInUp.duration(400).delay(150 + index * 50)}
              className="mb-4"
            >
              <View
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: display.colors.card,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: display.isDarkMode ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: display.isDarkMode ? '#78350F' : '#FEF3C7' }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Nunito_800ExtraBold',
                        fontSize: display.fontSize.base,
                        color: '#D97706',
                      }}
                    >
                      {article.number}
                    </Text>
                  </View>
                  <Text
                    className="flex-1"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: display.fontSize.lg,
                      color: display.colors.text,
                    }}
                  >
                    {article.title}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: 'Nunito_400Regular',
                    fontSize: display.fontSize.base,
                    color: display.colors.textSecondary,
                    lineHeight: display.fontSize.base * 1.6,
                  }}
                >
                  {article.content}
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
