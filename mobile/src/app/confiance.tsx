import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Shield,
  Server,
  Lock,
  FileCheck,
  Award,
  CheckCircle2,
  ExternalLink,
  Heart,
  Eye,
  Trash2,
  Download,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

interface Certification {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  details: string[];
}

const CERTIFICATIONS: Certification[] = [
  {
    id: 'rgpd',
    name: 'RGPD',
    fullName: 'Règlement Général sur la Protection des Données',
    icon: '🇪🇺',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    description: 'Conformité totale au règlement européen sur la protection des données personnelles.',
    details: [
      'Consentement explicite pour chaque traitement',
      'Droit d\'accès, de rectification et de suppression',
      'Portabilité de vos données',
      'Registre des traitements tenu à jour',
      'Délégué à la Protection des Données (DPO) désigné',
    ],
  },
  {
    id: 'hds',
    name: 'HDS',
    fullName: 'Hébergeur de Données de Santé',
    icon: '🏥',
    color: '#059669',
    bgColor: '#D1FAE5',
    description: 'Nos serveurs sont certifiés pour l\'hébergement de données de santé en France.',
    details: [
      'Certification HDS niveau 5 (infogérance)',
      'Datacenters situés en France',
      'Chiffrement AES-256 des données',
      'Audits de sécurité annuels',
      'Plan de continuité d\'activité',
    ],
  },
  {
    id: 'francenum',
    name: 'France Num',
    fullName: 'Initiative nationale pour la transformation numérique',
    icon: '🇫🇷',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: 'Labellisé par l\'initiative gouvernementale France Num pour l\'inclusion numérique.',
    details: [
      'Solution adaptée aux seniors',
      'Accessibilité renforcée',
      'Interface simplifiée',
      'Support en français',
      'Accompagnement des utilisateurs',
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    fullName: 'Système de Management de la Sécurité de l\'Information',
    icon: '🔒',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Certification internationale garantissant la sécurité de nos systèmes d\'information.',
    details: [
      'Politique de sécurité documentée',
      'Gestion des risques continue',
      'Contrôle d\'accès strict',
      'Formation des équipes',
      'Audits externes réguliers',
    ],
  },
];

const COMMITMENTS = [
  {
    icon: Server,
    title: 'Hébergement 100% français',
    description: 'Vos données sont stockées exclusivement sur des serveurs situés en France.',
  },
  {
    icon: Lock,
    title: 'Chiffrement de bout en bout',
    description: 'Toutes vos données sont chiffrées en transit et au repos.',
  },
  {
    icon: Eye,
    title: 'Aucune revente de données',
    description: 'Nous ne vendons jamais vos données à des tiers. Jamais.',
  },
  {
    icon: Trash2,
    title: 'Suppression sur demande',
    description: 'Demandez la suppression totale de vos données à tout moment.',
  },
  {
    icon: Download,
    title: 'Export de vos données',
    description: 'Téléchargez l\'intégralité de vos données dans un format standard.',
  },
  {
    icon: Heart,
    title: 'Transparence totale',
    description: 'Nous communiquons clairement sur nos pratiques de confidentialité.',
  },
];

export default function ConfianceScreen() {
  const router = useRouter();
  const display = useDisplaySettings();

  const handleOpenLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1E3A5F', '#1E40AF', '#1F2937']
          : ['#1E40AF', '#2563EB', '#3B82F6']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-6 active:opacity-70"
          >
            <ChevronLeft size={24} color="white" />
            <Text
              className="text-white text-base ml-1"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Retour
            </Text>
          </Pressable>

          <Animated.View entering={FadeInDown.duration(500)}>
            <View className="flex-row items-center mb-2">
              <Shield size={28} color="white" />
              <Text
                className="text-white text-3xl ml-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Confiance & Sécurité
              </Text>
            </View>
            <Text
              className="text-white/80 text-base"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Vos données sont notre priorité absolue
            </Text>
          </Animated.View>
        </View>

        <ScrollView
          className="flex-1 -mt-4"
          style={{ backgroundColor: display.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Trust badges summary */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="px-6 mb-6"
          >
            <View className="flex-row flex-wrap justify-between">
              {CERTIFICATIONS.map((cert, index) => (
                <View
                  key={cert.id}
                  className="items-center mb-4"
                  style={{ width: '23%' }}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: cert.bgColor }}
                  >
                    <Text style={{ fontSize: 24 }}>{cert.icon}</Text>
                  </View>
                  <Text
                    className="text-center"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: 11,
                      color: display.colors.text,
                    }}
                  >
                    {cert.name}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Main message */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="px-6 mb-6"
          >
            <View
              className="rounded-3xl p-6"
              style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF' }}
            >
              <View className="flex-row items-center mb-3">
                <CheckCircle2 size={24} color="#059669" />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.lg,
                    color: display.colors.text,
                  }}
                >
                  Notre engagement
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.base,
                  color: display.colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                MonAdmin a été conçu avec la sécurité et la confidentialité comme priorités.
                Nous comprenons la sensibilité des documents administratifs et médicaux.
                C'est pourquoi nous appliquons les normes les plus strictes pour protéger vos données.
              </Text>
            </View>
          </Animated.View>

          {/* Certifications detail */}
          <View className="px-6 mb-6">
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              Nos certifications
            </Text>

            {CERTIFICATIONS.map((cert, index) => (
              <Animated.View
                key={cert.id}
                entering={FadeIn.duration(400).delay(300 + index * 100)}
                className="mb-4"
              >
                <View
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: display.colors.card,
                    borderLeftWidth: 4,
                    borderLeftColor: cert.color,
                  }}
                >
                  <View className="p-5">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: cert.bgColor }}
                      >
                        <Text style={{ fontSize: 24 }}>{cert.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          style={{
                            fontFamily: 'Nunito_700Bold',
                            fontSize: display.fontSize.lg,
                            color: display.colors.text,
                          }}
                        >
                          {cert.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: display.fontSize.xs,
                            color: display.colors.textMuted,
                          }}
                        >
                          {cert.fullName}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className="mb-3"
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.sm,
                        color: display.colors.textSecondary,
                      }}
                    >
                      {cert.description}
                    </Text>

                    <View className="border-t pt-3" style={{ borderColor: display.isDarkMode ? '#374151' : '#E5E7EB' }}>
                      {cert.details.map((detail, i) => (
                        <View key={i} className="flex-row items-start mb-2">
                          <CheckCircle2 size={14} color={cert.color} style={{ marginTop: 2 }} />
                          <Text
                            className="ml-2 flex-1"
                            style={{
                              fontFamily: 'Nunito_400Regular',
                              fontSize: display.fontSize.sm,
                              color: display.colors.textSecondary,
                            }}
                          >
                            {detail}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Commitments */}
          <View className="px-6 mb-6">
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              Nos engagements
            </Text>

            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              {COMMITMENTS.map((commitment, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.duration(400).delay(600 + index * 50)}
                  style={{ width: '50%', padding: 6 }}
                >
                  <View
                    className="rounded-2xl p-4 h-40"
                    style={{ backgroundColor: display.colors.card }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#DBEAFE' }}
                    >
                      <commitment.icon size={20} color="#2563EB" />
                    </View>
                    <Text
                      className="mb-1"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: display.fontSize.sm,
                        color: display.colors.text,
                      }}
                    >
                      {commitment.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.xs,
                        color: display.colors.textMuted,
                      }}
                    >
                      {commitment.description}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Links */}
          <View className="px-6">
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: display.colors.card }}
            >
              {[
                { label: 'Politique de confidentialité', route: '/confidentialite' },
                { label: 'Conditions d\'utilisation', route: '/cgu' },
                { label: 'Exercer vos droits RGPD', email: 'rgpd@monadmin.fr' },
              ].map((link, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (link.route) {
                      router.push(link.route as any);
                    } else if (link.email) {
                      Linking.openURL(`mailto:${link.email}`);
                    }
                  }}
                  className="flex-row items-center justify-between p-4 active:bg-gray-50"
                  style={{
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: display.isDarkMode ? '#374151' : '#E5E7EB',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      fontSize: display.fontSize.base,
                      color: display.colors.primary,
                    }}
                  >
                    {link.label}
                  </Text>
                  <ExternalLink size={18} color={display.colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Footer badge */}
          <Animated.View
            entering={FadeIn.duration(400).delay(800)}
            className="px-6 mt-8"
          >
            <View
              className="rounded-2xl p-5 items-center"
              style={{ backgroundColor: display.isDarkMode ? '#064E3B' : '#ECFDF5' }}
            >
              <View className="flex-row items-center mb-2">
                <Shield size={20} color="#059669" />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.base,
                    color: '#059669',
                  }}
                >
                  Application de confiance
                </Text>
              </View>
              <Text
                className="text-center"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.sm,
                  color: display.isDarkMode ? '#6EE7B7' : '#047857',
                }}
              >
                MonAdmin respecte les normes les plus strictes en matière de sécurité et de protection des données.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
