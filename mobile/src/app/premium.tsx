import React from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X, Check, Crown, FileText, Volume2, Zap, Shield } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
} from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from '@/lib/i18n';

export default function PremiumScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslation();

  // Check if user already has premium
  const { data: isPremium, isLoading: checkingPremium } = useQuery({
    queryKey: ['premium-status'],
    queryFn: async () => {
      const result = await hasEntitlement('premium');
      return result.ok ? result.data : false;
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
    },
  });

  const monthlyPackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_monthly'
  );

  const handlePurchase = () => {
    if (monthlyPackage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      purchaseMutation.mutate(monthlyPackage);
    }
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restoreMutation.mutate();
  };

  const isLoading = checkingPremium || loadingOfferings;
  const isPurchasing = purchaseMutation.isPending || restoreMutation.isPending;

  const features = [
    {
      icon: FileText,
      title: t('premium.feature1'),
      description: t('premium.feature1_desc'),
    },
    {
      icon: Volume2,
      title: t('premium.feature2'),
      description: t('premium.feature2_desc'),
    },
    {
      icon: Zap,
      title: t('premium.feature3'),
      description: t('premium.feature3_desc'),
    },
    {
      icon: Shield,
      title: t('premium.feature4'),
      description: t('premium.feature4_desc'),
    },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // If already premium, show success state
  if (isPremium) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInUp.duration(600)}>
              <View className="w-32 h-32 rounded-full bg-white/80 items-center justify-center mb-6">
                <Crown size={64} color="#F59E0B" />
              </View>
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(100)}
              className="text-3xl text-amber-900 text-center mb-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {t('premium.already')}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(200)}
              className="text-lg text-amber-800 text-center mb-8"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {t('premium.already_msg')}
            </Animated.Text>
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <Pressable
                onPress={() => router.back()}
                className="bg-amber-900 rounded-2xl px-8 py-4"
              >
                <Text
                  className="text-white text-lg"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {t('premium.continue')}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1E3A8A', '#2563EB', '#3B82F6']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Close button */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 flex-row justify-end"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
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
            className="items-center px-8 pt-4 pb-8"
          >
            <View className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 items-center justify-center mb-6"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Crown size={48} color="white" />
            </View>
            <Text
              className="text-3xl text-white text-center mb-3"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {t('premium.title')}
            </Text>
            <Text
              className="text-lg text-blue-100 text-center"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {t('premium.subtitle')}
            </Text>
          </Animated.View>

          {/* Features */}
          <View className="px-6 mb-8">
            {features.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInUp.duration(400).delay(200 + index * 100)}
                className="bg-white/10 rounded-2xl p-5 mb-3 flex-row items-center"
              >
                <View className="w-14 h-14 rounded-xl bg-white/20 items-center justify-center">
                  <feature.icon size={28} color="white" />
                </View>
                <View className="flex-1 ml-4">
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    className="text-blue-200 text-sm mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {feature.description}
                  </Text>
                </View>
                <Check size={24} color="#34D399" />
              </Animated.View>
            ))}
          </View>

          {/* Pricing card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(600)}
            className="mx-6 mb-6"
          >
            <View className="bg-white rounded-3xl p-6 overflow-hidden">
              <View className="absolute top-0 right-0 bg-amber-500 px-4 py-1 rounded-bl-xl">
                <Text
                  className="text-white text-xs"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {t('premium.popular')}
                </Text>
              </View>

              <View className="items-center pt-4">
                <Text
                  className="text-gray-500 text-base"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {t('premium.monthly')}
                </Text>
                <View className="flex-row items-baseline mt-2">
                  <Text
                    className="text-5xl text-gray-900"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    {t('premium.price')}
                  </Text>
                  <Text
                    className="text-gray-500 text-lg ml-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {t('premium.per_month')}
                  </Text>
                </View>
                <Text
                  className="text-gray-400 text-sm mt-2"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {t('premium.cancel_anytime')}
                </Text>
              </View>

              {/* Subscribe button */}
              <Pressable
                onPress={handlePurchase}
                disabled={isPurchasing || !monthlyPackage}
                className="mt-6 rounded-2xl py-5 items-center active:scale-[0.98]"
                style={{
                  backgroundColor: isPurchasing ? '#93C5FD' : '#2563EB',
                }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-white text-xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {t('premium.subscribe')}
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* Restore purchases */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(700)}
            className="items-center"
          >
            <Pressable
              onPress={handleRestore}
              disabled={isPurchasing}
              className="py-3"
            >
              <Text
                className="text-blue-200 text-base underline"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {t('premium.restore')}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Terms */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(800)}
            className="px-8 mt-4"
          >
            <Text
              className="text-blue-300/60 text-xs text-center"
              style={{ fontFamily: 'Nunito_400Regular', lineHeight: 18 }}
            >
              {t('premium.terms')}
            </Text>
          </Animated.View>

          {/* Trust Badges */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(900)}
            className="px-6 mt-6 mb-4"
          >
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <View className="flex-row justify-center items-center mb-2">
                <Shield size={16} color="rgba(255,255,255,0.7)" />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
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
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Nunito_600SemiBold',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {badge}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                className="text-center mt-2"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                Données hébergées en France • Chiffrement AES-256
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
