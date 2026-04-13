import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  X,
  Check,
  Crown,
  FileText,
  Volume2,
  Zap,
  Shield,
  Users,
  Bell,
  Download,
  Headphones,
  Sparkles,
  Search,
  Globe,
  Clock,
  Star,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
  getPackage,
} from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from '@/lib/i18n';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

type PlanId = 'free' | 'essential' | 'family';
type BillingPeriod = 'monthly' | 'annual';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: string;
  features: PlanFeature[];
  color: string;
  gradientColors: [string, string];
  icon: any;
  popular?: boolean;
  entitlement: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PremiumScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const display = useDisplaySettings();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('essential');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');

  // Check current entitlements
  const { data: currentPlan, isLoading: checkingPremium } = useQuery({
    queryKey: ['premium-status-detailed'],
    queryFn: async () => {
      const familyResult = await hasEntitlement('family');
      if (familyResult.ok && familyResult.data) return 'family';

      const essentialResult = await hasEntitlement('premium');
      if (essentialResult.ok && essentialResult.data) return 'essential';

      return 'free';
    },
  });

  // Fetch offerings
  const { data: offerings, isLoading: loadingOfferings } = useQuery({
    queryKey: ['offerings'],
    queryFn: async () => {
      const result = await getOfferings();
      return result.ok ? result.data : null;
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const result = await purchasePackage(pkg);
      if (!result.ok) {
        throw new Error(result.reason);
      }
      return result.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['premium-status'] });
      queryClient.invalidateQueries({ queryKey: ['premium-status-detailed'] });
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const result = await restorePurchases();
      if (!result.ok) {
        throw new Error(result.reason);
      }
      return result.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['premium-status'] });
      queryClient.invalidateQueries({ queryKey: ['premium-status-detailed'] });
    },
  });

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Découverte',
      tagline: 'Pour essayer gratuitement',
      monthlyPrice: 0,
      annualPrice: 0,
      annualSavings: '',
      entitlement: 'free',
      color: '#6B7280',
      gradientColors: ['#F3F4F6', '#E5E7EB'],
      icon: Sparkles,
      features: [
        { text: '3 scans par mois', included: true },
        { text: 'Résumé simplifié basique', included: true },
        { text: '1 catégorie de document', included: true },
        { text: 'Historique 3 jours', included: true },
        { text: 'Interface senior-friendly', included: true },
        { text: 'Lecture vocale', included: false },
        { text: 'Partage familial', included: false },
      ],
    },
    {
      id: 'essential',
      name: 'Essentiel',
      tagline: 'Le plus populaire',
      monthlyPrice: 6.99,
      annualPrice: 39.99,
      annualSavings: '2 mois offerts',
      entitlement: 'premium',
      color: '#2563EB',
      gradientColors: ['#1E40AF', '#3B82F6'],
      icon: Crown,
      popular: true,
      features: [
        { text: '15 scans par mois', included: true, highlight: true },
        { text: 'Analyse IA complète', included: true, highlight: true },
        { text: 'Lecture vocale illimitée', included: true, highlight: true },
        { text: 'Toutes les catégories', included: true },
        { text: 'Historique illimité', included: true },
        { text: 'Recherche textuelle & vocale', included: true },
        { text: 'Support multilingue', included: true },
        { text: 'Partage familial', included: false },
      ],
    },
    {
      id: 'family',
      name: 'Famille',
      tagline: 'Tranquillité d\'esprit',
      monthlyPrice: 9.99,
      annualPrice: 74.99,
      annualSavings: '3 mois offerts',
      entitlement: 'family',
      color: '#059669',
      gradientColors: ['#047857', '#10B981'],
      icon: Users,
      features: [
        { text: 'Scans illimités', included: true, highlight: true },
        { text: 'Tout de Essentiel +', included: true },
        { text: 'Partage familial (5 membres)', included: true, highlight: true },
        { text: 'Alertes aidants (urgences)', included: true, highlight: true },
        { text: 'Réponses auto aux courriers', included: true, highlight: true },
        { text: 'Rappels d\'échéances', included: true },
        { text: 'Export PDF', included: true },
        { text: 'Support prioritaire', included: true },
      ],
    },
  ];

  const getPackageForPlan = (planId: PlanId): PurchasesPackage | undefined => {
    if (!offerings?.current) return undefined;

    const packageMap: Record<string, string> = {
      essential_monthly: '$rc_monthly',
      essential_annual: '$rc_annual',
      family_monthly: '$rc_family_monthly',
      family_annual: '$rc_family_annual',
    };

    const key = `${planId}_${billingPeriod}`;
    const pkgId = packageMap[key];

    return offerings.current.availablePackages.find(p => p.identifier === pkgId);
  };

  const handlePurchase = (planId: PlanId) => {
    if (planId === 'free') return;

    const pkg = getPackageForPlan(planId);
    if (pkg) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      purchaseMutation.mutate(pkg);
    }
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restoreMutation.mutate();
  };

  const isLoading = checkingPremium || loadingOfferings;
  const isPurchasing = purchaseMutation.isPending || restoreMutation.isPending;

  // If user has family plan, show success state
  if (currentPlan === 'family') {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#047857', '#10B981', '#34D399']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInUp.duration(600)}>
              <View className="w-32 h-32 rounded-full bg-white/80 items-center justify-center mb-6">
                <Users size={64} color="#059669" />
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(100)}
              className="text-3xl text-white text-center mb-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              Plan Famille actif !
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(200)}
              className="text-lg text-emerald-100 text-center mb-8"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Profitez de toutes les fonctionnalités sans limite pour toute la famille.
            </Animated.Text>
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <Pressable
                onPress={() => router.back()}
                className="bg-white rounded-2xl px-8 py-4"
              >
                <Text
                  className="text-emerald-700 text-lg"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Continuer
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // If user has essential plan
  if (currentPlan === 'essential') {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <Pressable
            onPress={() => router.back()}
            className="absolute top-14 right-6 w-10 h-10 rounded-full bg-white/20 items-center justify-center z-10"
          >
            <X size={24} color="white" />
          </Pressable>
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInUp.duration(600)}>
              <View className="w-32 h-32 rounded-full bg-white/80 items-center justify-center mb-6">
                <Crown size={64} color="#2563EB" />
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(100)}
              className="text-3xl text-white text-center mb-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              Plan Essentiel actif !
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(200)}
              className="text-lg text-blue-100 text-center mb-8"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Passez au plan Famille pour le partage et les alertes aidants.
            </Animated.Text>
            <Animated.View entering={FadeInUp.duration(600).delay(300)} className="w-full">
              <Pressable
                onPress={() => {
                  setSelectedPlan('family');
                  handlePurchase('family');
                }}
                className="bg-emerald-500 rounded-2xl px-8 py-4 mb-4"
              >
                <Text
                  className="text-white text-lg text-center"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Passer au Plan Famille
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                className="py-3"
              >
                <Text
                  className="text-blue-200 text-base text-center underline"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Continuer avec Essentiel
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: display.colors.background }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#0F172A' }}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Close button */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 flex-row justify-between items-center"
        >
          <View />
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <X size={24} color="white" />
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            className="items-center px-6 pt-2 pb-6"
          >
            <Text
              className="text-3xl text-white text-center mb-2"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              Choisissez votre formule
            </Text>
            <Text
              className="text-base text-slate-400 text-center"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Simplifiez l'admin de vos proches
            </Text>
          </Animated.View>

          {/* Billing toggle */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="mx-6 mb-6"
          >
            <View className="flex-row bg-slate-800 rounded-2xl p-1">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBillingPeriod('monthly');
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: billingPeriod === 'monthly' ? '#3B82F6' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    color: billingPeriod === 'monthly' ? 'white' : '#94A3B8',
                  }}
                >
                  Mensuel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBillingPeriod('annual');
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: billingPeriod === 'annual' ? '#3B82F6' : 'transparent',
                }}
              >
                <View className="flex-row items-center">
                  <Text
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      color: billingPeriod === 'annual' ? 'white' : '#94A3B8',
                    }}
                  >
                    Annuel
                  </Text>
                  <View className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500">
                    <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 10, color: 'white' }}>
                      -40%
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Plans */}
          {plans.map((plan, index) => {
            const isSelected = selectedPlan === plan.id;
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const perMonth = billingPeriod === 'annual' && plan.annualPrice > 0
              ? (plan.annualPrice / 12).toFixed(2)
              : null;

            return (
              <Animated.View
                key={plan.id}
                entering={FadeInUp.duration(400).delay(300 + index * 100)}
                className="mx-6 mb-4"
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlan(plan.id);
                  }}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    borderWidth: isSelected ? 3 : 1,
                    borderColor: isSelected ? plan.color : '#334155',
                    backgroundColor: isSelected ? '#1E293B' : '#0F172A',
                  }}
                >
                  {plan.popular && (
                    <LinearGradient
                      colors={plan.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-2 items-center"
                    >
                      <View className="flex-row items-center">
                        <Star size={14} color="white" fill="white" />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          LE PLUS POPULAIRE
                        </Text>
                      </View>
                    </LinearGradient>
                  )}

                  <View className="p-5">
                    {/* Plan header */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center"
                          style={{ backgroundColor: `${plan.color}20` }}
                        >
                          <plan.icon size={24} color={plan.color} />
                        </View>
                        <View className="ml-3">
                          <Text
                            className="text-white text-xl"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            {plan.name}
                          </Text>
                          <Text
                            className="text-slate-400 text-sm"
                            style={{ fontFamily: 'Nunito_400Regular' }}
                          >
                            {plan.tagline}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="w-6 h-6 rounded-full border-2 items-center justify-center"
                        style={{
                          borderColor: isSelected ? plan.color : '#475569',
                          backgroundColor: isSelected ? plan.color : 'transparent',
                        }}
                      >
                        {isSelected && <Check size={14} color="white" />}
                      </View>
                    </View>

                    {/* Price */}
                    <View className="mb-4">
                      {price === 0 ? (
                        <Text
                          className="text-3xl text-white"
                          style={{ fontFamily: 'Nunito_800ExtraBold' }}
                        >
                          Gratuit
                        </Text>
                      ) : (
                        <View className="flex-row items-baseline">
                          <Text
                            className="text-3xl text-white"
                            style={{ fontFamily: 'Nunito_800ExtraBold' }}
                          >
                            {price.toFixed(2).replace('.', ',')}€
                          </Text>
                          <Text
                            className="text-slate-400 text-base ml-1"
                            style={{ fontFamily: 'Nunito_400Regular' }}
                          >
                            /{billingPeriod === 'monthly' ? 'mois' : 'an'}
                          </Text>
                        </View>
                      )}
                      {perMonth && (
                        <Text
                          className="text-sm mt-1"
                          style={{ fontFamily: 'Nunito_400Regular', color: plan.color }}
                        >
                          soit {perMonth.replace('.', ',')}€/mois • {plan.annualSavings}
                        </Text>
                      )}
                    </View>

                    {/* Features */}
                    <View className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <View key={i} className="flex-row items-center">
                          {feature.included ? (
                            <Check size={16} color={feature.highlight ? plan.color : '#10B981'} />
                          ) : (
                            <X size={16} color="#475569" />
                          )}
                          <Text
                            className="ml-2"
                            style={{
                              fontFamily: feature.highlight ? 'Nunito_600SemiBold' : 'Nunito_400Regular',
                              fontSize: 14,
                              color: feature.included ? (feature.highlight ? plan.color : '#E2E8F0') : '#64748B',
                            }}
                          >
                            {feature.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* CTA Button */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(700)}
            className="mx-6 mt-2"
          >
            {selectedPlan === 'free' ? (
              <Pressable
                onPress={() => router.back()}
                className="rounded-2xl py-5 items-center"
                style={{ backgroundColor: '#475569' }}
              >
                <Text
                  className="text-white text-xl"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Continuer gratuitement
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handlePurchase(selectedPlan)}
                disabled={isPurchasing}
                className="rounded-2xl py-5 items-center active:scale-[0.98]"
                style={{
                  backgroundColor: isPurchasing
                    ? '#64748B'
                    : plans.find(p => p.id === selectedPlan)?.color || '#2563EB',
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-white text-xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    S'abonner maintenant
                  </Text>
                )}
              </Pressable>
            )}
          </Animated.View>

          {/* Restore */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(800)}
            className="items-center mt-4"
          >
            <Pressable
              onPress={handleRestore}
              disabled={isPurchasing}
              className="py-3"
            >
              <Text
                className="text-slate-400 text-base underline"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Restaurer mes achats
              </Text>
            </Pressable>
          </Animated.View>

          {/* Trust badges */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(900)}
            className="mx-6 mt-6 mb-4"
          >
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <View className="flex-row justify-center items-center mb-3">
                <Shield size={16} color="#94A3B8" />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: 12,
                    color: '#94A3B8',
                  }}
                >
                  Application de confiance
                </Text>
              </View>
              <View className="flex-row justify-center flex-wrap">
                {['🇪🇺 RGPD', '🏥 HDS', '🇫🇷 France Num', '🔒 ISO 27001'].map((badge, i) => (
                  <View
                    key={i}
                    className="px-2 py-1 rounded-full mx-1 mb-1"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Nunito_600SemiBold',
                        fontSize: 10,
                        color: '#94A3B8',
                      }}
                    >
                      {badge}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                className="text-center mt-3"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: 11,
                  color: '#64748B',
                  lineHeight: 16,
                }}
              >
                Annulez à tout moment • Données hébergées en France
              </Text>
            </View>
          </Animated.View>
        {/* Mentions légales requises par Apple 3.1.2(c) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, marginBottom: 16, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>En vous abonnant, vous acceptez nos </Text>
          <Pressable onPress={() => Linking.openURL('https://wifievmrlovkjlbnjgwr.supabase.co/storage/v1/object/public/legal/terms-of-use.html')}>
            <Text style={{ fontSize: 11, color: '#6366F1', textDecorationLine: 'underline' }}>CGU</Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}> et notre </Text>
          <Pressable onPress={() => Linking.openURL('https://wifievmrlovkjlbnjgwr.supabase.co/storage/v1/object/public/legal/privacy-policy.html')}>
            <Text style={{ fontSize: 11, color: '#6366F1', textDecorationLine: 'underline' }}>Politique de confidentialité</Text>
          </Pressable>
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
