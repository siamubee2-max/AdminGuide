import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Search, Mic, ChevronRight, Calendar, Wallet } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';
import { CATEGORIES, URGENCE_STYLES, DocumentCategory, Document } from '@/lib/types';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useTranslation } from '@/lib/i18n';

const CATEGORY_COLORS = {
  tous: { bg: '#F3F4F6', border: '#D1D5DB', icon: '#6B7280', text: '#374151' },
  sante: { bg: '#FEE2E2', border: '#FECACA', icon: '#DC2626', text: '#991B1B' },
  energie: { bg: '#FEF3C7', border: '#FDE68A', icon: '#D97706', text: '#92400E' },
  pension: { bg: '#DBEAFE', border: '#BFDBFE', icon: '#2563EB', text: '#1E40AF' },
  banque: { bg: '#D1FAE5', border: '#A7F3D0', icon: '#059669', text: '#047857' },
};

export default function DocumentsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const documents = useDocumentStore((s) => s.documents);
  const selectedCategory = useDocumentStore((s) => s.selectedCategory);
  const setSelectedCategory = useDocumentStore((s) => s.setSelectedCategory);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (selectedCategory !== 'tous') {
      filtered = filtered.filter((doc) => doc.categorie === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.titre.toLowerCase().includes(query) ||
          doc.organisme.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<DocumentCategory, number> = {
      tous: documents.length,
      sante: 0,
      energie: 0,
      pension: 0,
      banque: 0,
    };

    documents.forEach((doc) => {
      if (doc.categorie in counts) {
        counts[doc.categorie]++;
      }
    });

    return counts;
  }, [documents]);

  const handleDocumentPress = (doc: Document) => {
    setCurrentDocument(doc);
    router.push('/resultat');
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#F5F3FF', '#FFFBF5', '#FFFFFF']}
        locations={[0, 0.2, 0.5]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="px-6 pt-6 pb-4"
        >
          <View className="flex-row items-center">
            <Text style={{ fontSize: 32 }}>📁</Text>
            <View className="ml-3">
              <Text
                className="text-3xl text-text-primary"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {t('docs.title')}
              </Text>
              <Text
                className="text-base text-text-secondary mt-0.5"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {t('docs.count', { count: documents.length, s: documents.length > 1 ? 's' : '' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bannière hors-ligne */}
        <OfflineBanner showSyncStatus />

        {/* Search Bar améliorée */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          className="px-6 mb-5"
        >
          <View
            className="flex-row items-center rounded-2xl px-5 py-4"
            style={{
              backgroundColor: searchFocused ? '#FFFFFF' : '#F9FAFB',
              borderWidth: 2,
              borderColor: searchFocused ? '#2563EB' : '#E5E7EB',
              shadowColor: searchFocused ? '#2563EB' : '#000',
              shadowOffset: { width: 0, height: searchFocused ? 4 : 2 },
              shadowOpacity: searchFocused ? 0.15 : 0.05,
              shadowRadius: searchFocused ? 12 : 4,
              elevation: searchFocused ? 6 : 2,
            }}
          >
            <Search size={24} color={searchFocused ? '#2563EB' : '#9CA3AF'} />
            <TextInput
              className="flex-1 mx-4 text-lg text-text-primary"
              style={{ fontFamily: 'Nunito_400Regular' }}
              placeholder={t('docs.search')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <Pressable 
              className="w-12 h-12 rounded-xl items-center justify-center active:scale-95"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Mic size={22} color="#2563EB" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Category Filter - Horizontal scroll */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="mb-4"
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {CATEGORIES.map((category, index) => {
              const isSelected = selectedCategory === category.id;
              const count = categoryCounts[category.id];
              const colors = CATEGORY_COLORS[category.id];

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className="items-center rounded-2xl px-5 py-3 active:scale-95"
                  style={{
                    backgroundColor: isSelected ? colors.bg : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: isSelected ? colors.border : '#E5E7EB',
                    minWidth: 85,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{category.icon}</Text>
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      color: isSelected ? colors.text : '#6B7280',
                    }}
                  >
                    {t(`category.${category.id}` as any)}
                  </Text>
                  <View
                    className="mt-1.5 rounded-full px-2.5 py-0.5"
                    style={{
                      backgroundColor: isSelected ? colors.border : '#F3F4F6',
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ 
                        fontFamily: 'Nunito_700Bold',
                        color: isSelected ? colors.text : '#9CA3AF',
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Document List */}
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredDocuments.length === 0 ? (
            <Animated.View 
              entering={FadeIn.duration(400)}
              className="items-center justify-center py-16"
            >
              <View 
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text style={{ fontSize: 48 }}>📭</Text>
              </View>
              <Text
                className="text-xl text-text-primary text-center"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {t('docs.empty_title')}
              </Text>
              <Text
                className="text-base text-text-secondary text-center mt-2 px-8"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {t('docs.empty_msg')}
              </Text>
            </Animated.View>
          ) : (
            filteredDocuments.map((doc, index) => {
              const urgenceStyle = URGENCE_STYLES[doc.urgence];
              const categoryColors = CATEGORY_COLORS[doc.categorie] || CATEGORY_COLORS.tous;

              return (
                <Animated.View
                  key={doc.id}
                  entering={FadeInUp.duration(400).delay(300 + index * 80).springify()}
                >
                  <Pressable
                    onPress={() => handleDocumentPress(doc)}
                    className="bg-white rounded-3xl mb-4 overflow-hidden active:scale-[0.98]"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                  >
                    {/* Bande de couleur en haut */}
                    <LinearGradient
                      colors={urgenceStyle.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 6 }}
                    />
                    
                    <View className="p-5">
                      {/* Header avec badges */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 mr-4">
                          <Text
                            className="text-xl text-text-primary"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                            numberOfLines={2}
                          >
                            {doc.titre}
                          </Text>
                          <View className="flex-row items-center mt-2">
                            <View 
                              className="rounded-lg px-2.5 py-1"
                              style={{ backgroundColor: categoryColors.bg }}
                            >
                              <Text
                                className="text-sm"
                                style={{ 
                                  fontFamily: 'Nunito_600SemiBold',
                                  color: categoryColors.text,
                                }}
                              >
                                {doc.organisme}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        {/* Badge urgence */}
                        <View
                          className="rounded-2xl px-3.5 py-2 flex-row items-center"
                          style={{
                            backgroundColor: urgenceStyle.background,
                            borderWidth: 2,
                            borderColor: urgenceStyle.border,
                          }}
                        >
                          <Text style={{ fontSize: 14 }}>{urgenceStyle.icon}</Text>
                          <Text
                            className="ml-1.5"
                            style={{
                              fontFamily: 'Nunito_700Bold',
                              fontSize: 13,
                              color: urgenceStyle.text,
                            }}
                          >
                            {t(`urgence.${doc.urgence}` as any)}
                          </Text>
                        </View>
                      </View>

                      {/* Informations supplémentaires */}
                      {(doc.montant || doc.dateLimite) && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                          {doc.montant && (
                            <View className="flex-row items-center mr-5">
                              <View 
                                className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                                style={{ backgroundColor: '#D1FAE5' }}
                              >
                                <Wallet size={16} color="#059669" />
                              </View>
                              <Text
                                className="text-base text-text-primary"
                                style={{ fontFamily: 'Nunito_700Bold' }}
                              >
                                {doc.montant}
                              </Text>
                            </View>
                          )}
                          {doc.dateLimite && (
                            <View className="flex-row items-center">
                              <View 
                                className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                                style={{ backgroundColor: '#FEE2E2' }}
                              >
                                <Calendar size={16} color="#DC2626" />
                              </View>
                              <Text
                                className="text-base text-text-primary"
                                style={{ fontFamily: 'Nunito_600SemiBold' }}
                              >
                                {doc.dateLimite}
                              </Text>
                            </View>
                          )}
                          <View className="flex-1" />
                          <ChevronRight size={20} color="#9CA3AF" />
                        </View>
                      )}
                      
                      {!doc.montant && !doc.dateLimite && (
                        <View className="flex-row items-center justify-end mt-2">
                          <Text
                            className="text-sm mr-1"
                            style={{ fontFamily: 'Nunito_400Regular', color: '#9CA3AF' }}
                          >
                            {t('docs.see_details')}
                          </Text>
                          <ChevronRight size={18} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
