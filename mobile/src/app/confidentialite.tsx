import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

const SECTIONS = [
  {
    title: 'Collecte des donnees',
    icon: '📋',
    content:
      "MonAdmin collecte uniquement les donnees necessaires au fonctionnement de l'application :\n\n- Les photos de vos documents pour l'analyse par intelligence artificielle\n- Vos informations de profil (prenom, nom, adresse) que vous renseignez volontairement\n- Vos preferences d'affichage et de notifications\n- Les coordonnees de vos aidants si vous les ajoutez",
  },
  {
    title: 'Utilisation des donnees',
    icon: '🔍',
    content:
      "Vos donnees sont utilisees exclusivement pour :\n\n- Analyser vos documents administratifs et vous fournir des explications simplifiees\n- Generer des reponses aux courriers\n- Programmer des rappels personnalises\n- Adapter l'affichage a vos preferences (taille du texte, mode sombre, etc.)",
  },
  {
    title: 'Stockage des donnees',
    icon: '💾',
    content:
      "Vos documents et donnees personnelles sont stockes localement sur votre appareil. Les photos de documents sont envoyees de maniere securisee aux services d'intelligence artificielle (Anthropic Claude ou OpenAI) pour analyse, mais ne sont pas conservees par ces services au-dela du traitement.",
  },
  {
    title: 'Partage des donnees',
    icon: '🤝',
    content:
      "MonAdmin ne vend, ne loue et ne partage jamais vos donnees personnelles avec des tiers a des fins commerciales.\n\nLes seuls partages effectues sont :\n- L'envoi temporaire des photos de documents aux services d'IA pour analyse\n- Le partage de documents avec vos aidants si vous en faites la demande",
  },
  {
    title: 'Vos droits',
    icon: '⚖️',
    content:
      "Conformement au Reglement General sur la Protection des Donnees (RGPD), vous disposez des droits suivants :\n\n- Droit d'acces a vos donnees\n- Droit de rectification\n- Droit a l'effacement (droit a l'oubli)\n- Droit a la portabilite des donnees\n- Droit d'opposition au traitement\n\nPour exercer ces droits, contactez-nous via la section 'Nous contacter' des reglages.",
  },
  {
    title: 'Securite',
    icon: '🔐',
    content:
      "Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees :\n\n- Chiffrement des communications avec les services d'IA\n- Stockage local securise sur votre appareil\n- Aucun mot de passe ou donnee bancaire collecte",
  },
];

export default function ConfidentialiteScreen() {
  const router = useRouter();
  const display = useDisplaySettings();

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1F2937', '#111827', '#0F172A']
          : ['#EFF6FF', '#F5F3FF', '#FFFFFF']}
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
              style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#DBEAFE' }}
            >
              <ChevronLeft size={24} color={display.colors.primary} />
            </View>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: display.colors.primary,
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
              style={{ backgroundColor: display.isDarkMode ? '#312E81' : '#EDE9FE' }}
            >
              <Shield size={28} color="#7C3AED" />
            </View>
            <View className="ml-4 flex-1">
              <Text
                style={{
                  fontFamily: 'Nunito_800ExtraBold',
                  fontSize: display.fontSize['2xl'],
                  color: display.colors.text,
                }}
              >
                Politique de confidentialite
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
          {/* Intro */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)}>
            <View
              className="rounded-2xl p-5 mb-5"
              style={{
                backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF',
                borderWidth: 1,
                borderColor: display.isDarkMode ? '#2563EB' : '#BFDBFE',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.base,
                  color: display.isDarkMode ? '#93C5FD' : '#1E40AF',
                  lineHeight: display.fontSize.base * 1.6,
                }}
              >
                MonAdmin s'engage a proteger votre vie privee. Cette politique explique quelles donnees nous collectons, comment nous les utilisons et quels sont vos droits.
              </Text>
            </View>
          </Animated.View>

          {/* Sections */}
          {SECTIONS.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={FadeInUp.duration(400).delay(200 + index * 60)}
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
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{section.icon}</Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: display.fontSize.lg,
                      color: display.colors.text,
                      flex: 1,
                    }}
                  >
                    {section.title}
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
                  {section.content}
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
