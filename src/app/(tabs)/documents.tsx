import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Mic } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';
import { CATEGORIES, URGENCE_STYLES, DocumentCategory, Document } from '@/lib/types';

export default function DocumentsScreen() {
  const router = useRouter();
  const documents = useDocumentStore((s) => s.documents);
  const selectedCategory = useDocumentStore((s) => s.selectedCategory);
  const setSelectedCategory = useDocumentStore((s) => s.setSelectedCategory);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);

  const [searchQuery, setSearchQuery] = React.useState('');

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
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-6 pb-4"
        >
          <Text
            className="text-3xl text-text-primary"
            style={{ fontFamily: 'Nunito_800ExtraBold' }}
          >
            Mes documents
          </Text>
          <Text
            className="text-lg text-text-secondary mt-1"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          className="px-6 mb-4"
        >
          <View
            className="flex-row items-center bg-white rounded-2xl px-5 py-4"
            style={{
              borderWidth: 2,
              borderColor: '#E8EAF6',
            }}
          >
            <Search size={24} color="#5C6BC0" />
            <TextInput
              className="flex-1 mx-4 text-lg text-text-primary"
              style={{ fontFamily: 'Nunito_400Regular' }}
              placeholder="Rechercher un document..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center">
              <Mic size={22} color="#1565C0" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Category Filter - Grid layout */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="mb-3 px-6"
        >
          {/* First row: Tous, Santé, Énergie */}
          <View className="flex-row mb-1.5">
            {CATEGORIES.slice(0, 3).map((category) => {
              const isSelected = selectedCategory === category.id;
              const count = categoryCounts[category.id];

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`flex-1 mx-1 items-center rounded-lg py-2 ${
                    isSelected ? 'bg-primary' : 'bg-white'
                  }`}
                  style={{
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#1565C0' : '#E8EAF6',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{category.icon}</Text>
                  <Text
                    className={`text-xs mt-0.5 ${isSelected ? 'text-white' : 'text-text-primary'}`}
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {category.label}
                  </Text>
                  <View
                    className={`mt-0.5 rounded px-1.5 ${
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs ${isSelected ? 'text-white' : 'text-text-secondary'}`}
                      style={{ fontFamily: 'Nunito_700Bold', fontSize: 10 }}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {/* Second row: Pension, Banque */}
          <View className="flex-row">
            {CATEGORIES.slice(3).map((category) => {
              const isSelected = selectedCategory === category.id;
              const count = categoryCounts[category.id];

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`flex-1 mx-1 items-center rounded-lg py-2 ${
                    isSelected ? 'bg-primary' : 'bg-white'
                  }`}
                  style={{
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#1565C0' : '#E8EAF6',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{category.icon}</Text>
                  <Text
                    className={`text-xs mt-0.5 ${isSelected ? 'text-white' : 'text-text-primary'}`}
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {category.label}
                  </Text>
                  <View
                    className={`mt-0.5 rounded px-1.5 ${
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs ${isSelected ? 'text-white' : 'text-text-secondary'}`}
                      style={{ fontFamily: 'Nunito_700Bold', fontSize: 10 }}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Document List */}
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredDocuments.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Text style={{ fontSize: 64, marginBottom: 16 }}>📭</Text>
              <Text
                className="text-xl text-text-primary text-center"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Aucun document trouvé
              </Text>
              <Text
                className="text-base text-text-secondary text-center mt-2"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Scannez un nouveau courrier pour commencer
              </Text>
            </View>
          ) : (
            filteredDocuments.map((doc, index) => {
              const urgenceStyle = URGENCE_STYLES[doc.urgence];

              return (
                <Animated.View
                  key={doc.id}
                  entering={FadeInUp.duration(400).delay(300 + index * 50)}
                >
                  <Pressable
                    onPress={() => handleDocumentPress(doc)}
                    className="bg-white rounded-2xl p-5 mb-4 active:opacity-90"
                    style={{
                      borderLeftWidth: 6,
                      borderLeftColor: urgenceStyle.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-4">
                        <Text
                          className="text-lg text-text-primary"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                          numberOfLines={2}
                        >
                          {doc.titre}
                        </Text>
                        <Text
                          className="text-base text-text-secondary mt-1"
                          style={{ fontFamily: 'Nunito_400Regular' }}
                        >
                          {doc.organisme}
                        </Text>
                      </View>
                      <View
                        className="rounded-xl px-3 py-1.5 flex-row items-center"
                        style={{
                          backgroundColor: urgenceStyle.background,
                          borderWidth: 2,
                          borderColor: urgenceStyle.border,
                        }}
                      >
                        <Text style={{ marginRight: 4, fontSize: 12 }}>
                          {urgenceStyle.icon}
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            fontSize: 14,
                            color: urgenceStyle.text,
                          }}
                        >
                          {urgenceStyle.label}
                        </Text>
                      </View>
                    </View>

                    {(doc.montant || doc.dateLimite) && (
                      <View className="flex-row mt-2 space-x-4">
                        {doc.montant && (
                          <View className="flex-row items-center">
                            <Text className="text-lg mr-1">💰</Text>
                            <Text
                              className="text-base text-text-primary"
                              style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                              {doc.montant}
                            </Text>
                          </View>
                        )}
                        {doc.dateLimite && (
                          <View className="flex-row items-center">
                            <Text className="text-lg mr-1">📅</Text>
                            <Text
                              className="text-base text-text-primary"
                              style={{ fontFamily: 'Nunito_600SemiBold' }}
                            >
                              {doc.dateLimite}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
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
