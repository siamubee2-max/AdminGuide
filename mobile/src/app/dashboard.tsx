import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Zap,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';
import { useSettingsStore } from '@/lib/state/settings-store';
import { CATEGORIES, URGENCE_STYLES, DocumentCategory } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; text: string; icon: string }> = {
  tous: { bg: '#F3F4F6', text: '#374151', icon: '📋' },
  sante: { bg: '#FEE2E2', text: '#991B1B', icon: '🏥' },
  energie: { bg: '#FEF3C7', text: '#92400E', icon: '💡' },
  pension: { bg: '#DBEAFE', text: '#1E40AF', icon: '👴' },
  banque: { bg: '#D1FAE5', text: '#047857', icon: '🏦' },
  impots: { bg: '#E0E7FF', text: '#3730A3', icon: '📊' },
  assurance: { bg: '#FCE7F3', text: '#9D174D', icon: '🏠' },
  juridique: { bg: '#FEF9C3', text: '#854D0E', icon: '⚖️' },
  medical: { bg: '#CCFBF1', text: '#115E59', icon: '🩺' },
};

export default function DashboardScreen() {
  const router = useRouter();
  const t = useTranslation();
  const documents = useDocumentStore((s) => s.documents);
  const userPrenom = useSettingsStore((s) => s.profile.prenom);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = documents.length;
    
    // By urgency
    const urgent = documents.filter(d => d.urgence === 'rouge').length;
    const thisWeek = documents.filter(d => d.urgence === 'orange').length;
    const notUrgent = documents.filter(d => d.urgence === 'vert').length;
    
    // By category
    const byCategory = CATEGORIES.slice(1).map(cat => ({
      ...cat,
      count: documents.filter(d => d.categorie === cat.id).length,
      colors: CATEGORY_COLORS[cat.id],
    }));

    // Documents with deadlines soon (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingDeadlines = documents
      .filter(d => d.dateLimite)
      .filter(d => {
        const deadline = parseFrenchDate(d.dateLimite!);
        return deadline && deadline >= now && deadline <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = parseFrenchDate(a.dateLimite!);
        const dateB = parseFrenchDate(b.dateLimite!);
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
      });

    // Documents with amounts
    const withAmounts = documents.filter(d => d.montant);
    const totalAmount = withAmounts.reduce((sum, d) => {
      const amount = parseFloat(d.montant!.replace(/[^\d,]/g, '').replace(',', '.'));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      total,
      urgent,
      thisWeek,
      notUrgent,
      byCategory,
      upcomingDeadlines,
      totalAmount,
      withAmounts: withAmounts.length,
    };
  }, [documents]);

  const handleDocumentPress = (doc: typeof documents[0]) => {
    setCurrentDocument(doc);
    router.push('/resultat');
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#1E40AF', '#2563EB', '#3B82F6']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-6"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-4 active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <ChevronLeft size={24} color="white" />
            </View>
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {t('common.back')}
            </Text>
          </Pressable>
          
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: 'Nunito_800ExtraBold' }}
          >
            {t('dashboard.title')}
          </Text>
          <Text
            className="text-lg text-white/80 mt-1"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {t('dashboard.greeting', { name: userPrenom })}
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Stats Cards */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="px-6 mb-6"
          >
            <View className="flex-row space-x-4">
              {/* Total documents */}
              <View 
                className="flex-1 rounded-3xl p-5"
                style={{ 
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View 
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: '#EFF6FF' }}
                  >
                    <FileText size={24} color="#2563EB" />
                  </View>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text
                  className="text-4xl text-text-primary"
                  style={{ fontFamily: 'Nunito_800ExtraBold' }}
                >
                  {stats.total}
                </Text>
                <Text
                  className="text-sm text-text-secondary mt-1"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {t('dashboard.total')}
                </Text>
              </View>

              {/* Urgent */}
              <View 
                className="flex-1 rounded-3xl p-5"
                style={{ 
                  backgroundColor: stats.urgent > 0 ? '#FEF2F2' : 'white',
                  borderWidth: stats.urgent > 0 ? 2 : 0,
                  borderColor: '#FECACA',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View 
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <AlertTriangle size={24} color="#DC2626" />
                  </View>
                  {stats.urgent > 0 && <Zap size={20} color="#DC2626" />}
                </View>
                <Text
                  className="text-4xl"
                  style={{ fontFamily: 'Nunito_800ExtraBold', color: stats.urgent > 0 ? '#DC2626' : '#374151' }}
                >
                  {stats.urgent}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ fontFamily: 'Nunito_400Regular', color: stats.urgent > 0 ? '#991B1B' : '#6B7280' }}
                >
                  {t('dashboard.urgent', { s: stats.urgent > 1 ? 's' : '' })}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Urgency Breakdown */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="px-6 mb-6"
          >
            <View 
              className="rounded-3xl p-5"
              style={{ backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
            >
              <Text
                className="text-lg text-text-primary mb-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {t('dashboard.urgency_title')}
              </Text>
              
              {/* Visual bar */}
              <View className="h-8 rounded-full overflow-hidden flex-row mb-4">
                {stats.urgent > 0 && (
                  <View 
                    style={{ 
                      flex: stats.urgent, 
                      backgroundColor: '#EF4444',
                    }} 
                  />
                )}
                {stats.thisWeek > 0 && (
                  <View 
                    style={{ 
                      flex: stats.thisWeek, 
                      backgroundColor: '#F59E0B',
                    }} 
                  />
                )}
                {stats.notUrgent > 0 && (
                  <View 
                    style={{ 
                      flex: stats.notUrgent, 
                      backgroundColor: '#10B981',
                    }} 
                  />
                )}
                {stats.total === 0 && (
                  <View style={{ flex: 1, backgroundColor: '#E5E7EB' }} />
                )}
              </View>

              {/* Legend */}
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#EF4444' }} />
                  <Text className="text-sm" style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>
                    {t('dashboard.urgent_count', { count: stats.urgent })}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#F59E0B' }} />
                  <Text className="text-sm" style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>
                    {t('dashboard.week_count', { count: stats.thisWeek })}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#10B981' }} />
                  <Text className="text-sm" style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>
                    {t('dashboard.ok_count', { count: stats.notUrgent })}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Categories */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            className="px-6 mb-6"
          >
            <Text
              className="text-lg text-text-primary mb-4"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {t('dashboard.by_category')}
            </Text>
            
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              {stats.byCategory.map((cat, index) => (
                <Animated.View
                  key={cat.id}
                  entering={FadeIn.duration(400).delay(400 + index * 100)}
                  style={{ width: '50%', padding: 6 }}
                >
                  <Pressable
                    onPress={() => router.push('/(tabs)/documents')}
                    className="rounded-2xl p-4 active:scale-95"
                    style={{ backgroundColor: cat.colors.bg }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
                      <Text
                        className="text-2xl"
                        style={{ fontFamily: 'Nunito_800ExtraBold', color: cat.colors.text }}
                      >
                        {cat.count}
                      </Text>
                    </View>
                    <Text
                      className="text-sm"
                      style={{ fontFamily: 'Nunito_600SemiBold', color: cat.colors.text }}
                    >
                      {t(`category.${cat.id}` as any)}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Amount summary */}
          {stats.withAmounts > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(500)}
              className="px-6 mb-6"
            >
              <View 
                className="rounded-3xl overflow-hidden"
                style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 }}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 20, borderRadius: 24 }}
                >
                  <View className="flex-row items-center mb-3">
                    <Text style={{ fontSize: 28 }}>💰</Text>
                    <Text
                      className="text-lg text-white/90 ml-3"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      {t('dashboard.amounts')}
                    </Text>
                  </View>
                  <Text
                    className="text-4xl text-white"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    {stats.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </Text>
                  <Text
                    className="text-base text-white/70 mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Sur {stats.withAmounts} document{stats.withAmounts > 1 ? 's' : ''}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* Upcoming deadlines */}
          {stats.upcomingDeadlines.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(600)}
              className="px-6 mb-6"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  className="text-lg text-text-primary"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  ⏰ Échéances proches
                </Text>
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Text
                    className="text-sm"
                    style={{ fontFamily: 'Nunito_700Bold', color: '#DC2626' }}
                  >
                    {stats.upcomingDeadlines.length}
                  </Text>
                </View>
              </View>
              
              <View 
                className="rounded-3xl overflow-hidden"
                style={{ backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
              >
                {stats.upcomingDeadlines.slice(0, 3).map((doc, index) => {
                  const urgenceStyle = URGENCE_STYLES[doc.urgence];
                  return (
                    <Pressable
                      key={doc.id}
                      onPress={() => handleDocumentPress(doc)}
                      className="p-4 flex-row items-center active:bg-gray-50"
                      style={{ 
                        borderTopWidth: index > 0 ? 1 : 0, 
                        borderTopColor: '#F3F4F6',
                      }}
                    >
                      <View 
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: urgenceStyle.background }}
                      >
                        <Text style={{ fontSize: 20 }}>{urgenceStyle.icon}</Text>
                      </View>
                      <View className="flex-1 ml-4">
                        <Text
                          className="text-base text-text-primary"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                          numberOfLines={1}
                        >
                          {doc.titre}
                        </Text>
                        <Text
                          className="text-sm"
                          style={{ fontFamily: 'Nunito_400Regular', color: urgenceStyle.text }}
                        >
                          📅 {doc.dateLimite}
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Quick tips */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(700)}
            className="px-6"
          >
            <View 
              className="rounded-3xl p-5"
              style={{ backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: '#DDD6FE' }}
            >
              <View className="flex-row items-center mb-3">
                <Text style={{ fontSize: 24 }}>💡</Text>
                <Text
                  className="text-lg ml-2"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#5B21B6' }}
                >
                  Conseil
                </Text>
              </View>
              <Text
                className="text-base leading-6"
                style={{ fontFamily: 'Nunito_400Regular', color: '#6D28D9' }}
              >
                {stats.urgent > 0 
                  ? `Vous avez ${stats.urgent} document${stats.urgent > 1 ? 's' : ''} urgent${stats.urgent > 1 ? 's' : ''}. Traitez-les en priorité !`
                  : stats.thisWeek > 0
                  ? `${stats.thisWeek} document${stats.thisWeek > 1 ? 's' : ''} à traiter cette semaine. Prenez de l'avance !`
                  : 'Bravo ! Tous vos courriers sont à jour. Continuez comme ça ! 🎉'}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Helper to parse French date
function parseFrenchDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
  };

  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!match) return null;

  const [, day, monthStr, year] = match;
  const month = months[monthStr.toLowerCase()];
  
  if (month === undefined) return null;

  return new Date(parseInt(year), month, parseInt(day));
}
