import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink,
  FileText,
  Building2,
  Heart,
  Car,
  Home,
  Wallet,
  Info,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { useTranslation } from '@/lib/i18n';

// Supported administrative services that could connect via FranceConnect
const SERVICES = [
  {
    id: 'impots',
    name: 'Impots.gouv.fr',
    description: 'Consulter vos avis, payer vos impots',
    icon: Wallet,
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  {
    id: 'ameli',
    name: 'Ameli.fr',
    description: 'Sante, remboursements, carte vitale',
    icon: Heart,
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'caf',
    name: 'CAF.fr',
    description: 'Allocations familiales, aides',
    icon: Home,
    color: '#7C3AED',
    bgColor: '#F3E8FF',
  },
  {
    id: 'retraite',
    name: 'Info-retraite.fr',
    description: 'Relevé de carrière, pension',
    icon: Building2,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'ants',
    name: 'ANTS',
    description: 'Carte grise, permis de conduire',
    icon: Car,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'service_public',
    name: 'Service-public.fr',
    description: 'Demarches administratives',
    icon: FileText,
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
  },
];

export default function FranceConnectScreen() {
  const router = useRouter();
  const display = useDisplaySettings();
  const t = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedService, setConnectedService] = useState<string | null>(null);

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnecting(true);

    // Simulate connection attempt (placeholder)
    setTimeout(() => {
      setIsConnecting(false);
      Alert.alert(
        'FranceConnect',
        'Cette fonctionnalité sera bientôt disponible. FranceConnect vous permettra de vous connecter à tous vos services administratifs en un clic.',
        [{ text: 'Compris', style: 'default' }]
      );
    }, 1500);
  };

  const handleServicePress = (serviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Placeholder - in real implementation, this would initiate OAuth flow
    Alert.alert(
      'Connexion au service',
      'La connexion à ce service via FranceConnect sera disponible prochainement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Visiter le site',
          onPress: () => {
            const urls: Record<string, string> = {
              impots: 'https://www.impots.gouv.fr',
              ameli: 'https://www.ameli.fr',
              caf: 'https://www.caf.fr',
              retraite: 'https://www.info-retraite.fr',
              ants: 'https://ants.gouv.fr',
              service_public: 'https://www.service-public.fr',
            };
            if (urls[serviceId]) {
              Linking.openURL(urls[serviceId]);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1E3A5F', '#111827', '#0F172A']
          : ['#1D4ED8', '#2563EB', '#3B82F6']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4 flex-row items-center"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center active:opacity-70"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <ChevronLeft size={24} color="white" />
            </View>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: 'white',
              }}
            >
              Retour
            </Text>
          </Pressable>
        </Animated.View>

        {/* Logo and Title */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          className="px-6 pb-6 items-center"
        >
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: 'white' }}
          >
            <Shield size={40} color="#1D4ED8" strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'Nunito_800ExtraBold',
              fontSize: display.fontSize['3xl'],
              color: 'white',
            }}
          >
            FranceConnect
          </Text>
          <Text
            className="text-center mt-2"
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: display.fontSize.base,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Connectez-vous a vos services administratifs en un clic
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Connect Button */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="mx-6 mb-6"
          >
            <Pressable
              onPress={handleConnect}
              disabled={isConnecting}
              className="rounded-3xl overflow-hidden active:scale-[0.98]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={{
                  padding: 24,
                  borderRadius: 24,
                  borderWidth: 3,
                  borderColor: '#1D4ED8',
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: '#1D4ED8' }}
                  >
                    {isConnecting ? (
                      <Text style={{ fontSize: 28 }}>...</Text>
                    ) : (
                      <LinkIcon size={32} color="white" />
                    )}
                  </View>
                  <View className="ml-5 flex-1">
                    <Text
                      style={{
                        fontFamily: 'Nunito_800ExtraBold',
                        fontSize: display.fontSize.xl,
                        color: '#1D4ED8',
                      }}
                    >
                      {isConnecting ? 'Connexion...' : 'Se connecter'}
                    </Text>
                    <Text
                      className="mt-1"
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.sm,
                        color: '#6B7280',
                      }}
                    >
                      Utilisez votre identifiant FranceConnect
                    </Text>
                  </View>
                  <ChevronRight size={24} color="#1D4ED8" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* What is FranceConnect */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(250)}
            className="mx-6 mb-6"
          >
            <View
              className="rounded-2xl p-5"
              style={{
                backgroundColor: display.colors.card,
                borderWidth: 1,
                borderColor: display.colors.border,
              }}
            >
              <View className="flex-row items-center mb-3">
                <Info size={20} color={display.colors.primary} />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.lg,
                    color: display.colors.text,
                  }}
                >
                  C'est quoi FranceConnect ?
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
                FranceConnect est un service de l'Etat qui vous permet de vous
                identifier sur plus de 1400 services en ligne en utilisant un
                compte que vous possedez deja (impots, Ameli, La Poste...).
              </Text>

              <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
                {['Securise', 'Simple', 'Gratuit'].map((badge, i) => (
                  <View
                    key={badge}
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <CheckCircle2 size={14} color="#059669" />
                    <Text
                      className="ml-1.5"
                      style={{
                        fontFamily: 'Nunito_600SemiBold',
                        fontSize: 12,
                        color: '#047857',
                      }}
                    >
                      {badge}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Available Services */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            className="mx-6"
          >
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.lg,
                color: display.colors.text,
              }}
            >
              Services accessibles
            </Text>

            <View className="space-y-3">
              {SERVICES.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Animated.View
                    key={service.id}
                    entering={FadeIn.duration(300).delay(350 + index * 50)}
                  >
                    <Pressable
                      onPress={() => handleServicePress(service.id)}
                      className="rounded-2xl p-4 flex-row items-center active:scale-[0.98]"
                      style={{
                        backgroundColor: display.colors.card,
                        borderWidth: 1,
                        borderColor: display.colors.border,
                      }}
                    >
                      <View
                        className="w-14 h-14 rounded-xl items-center justify-center"
                        style={{ backgroundColor: service.bgColor }}
                      >
                        <IconComponent size={26} color={service.color} />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text
                          style={{
                            fontFamily: 'Nunito_700Bold',
                            fontSize: display.fontSize.base,
                            color: display.colors.text,
                          }}
                        >
                          {service.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: display.fontSize.sm,
                            color: display.colors.textMuted,
                          }}
                        >
                          {service.description}
                        </Text>
                      </View>
                      <ExternalLink size={20} color={display.colors.textMuted} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Security Note */}
          <Animated.View
            entering={FadeIn.duration(400).delay(600)}
            className="mx-6 mt-6"
          >
            <View
              className="rounded-xl py-3 px-4 flex-row items-center"
              style={{
                backgroundColor: display.isDarkMode ? 'rgba(30, 58, 95, 0.5)' : 'rgba(219, 234, 254, 0.6)',
                borderWidth: 1,
                borderColor: display.isDarkMode ? '#1E3A5F' : '#BFDBFE',
              }}
            >
              <Shield size={16} color={display.isDarkMode ? '#93C5FD' : '#1D4ED8'} />
              <Text
                className="ml-2 flex-1"
                style={{
                  fontFamily: 'Nunito_500Medium',
                  fontSize: 12,
                  color: display.isDarkMode ? '#93C5FD' : '#1E40AF',
                }}
              >
                Vos donnees sont protegees et ne sont jamais stockees par MonAdmin
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
