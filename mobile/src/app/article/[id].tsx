import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

// Article data (same as in communaute.tsx - in production would come from API)
const ARTICLES_DATA: Record<string, any> = {
  '1': {
    id: '1',
    slug: 'comment-aider-parents-gerer-admin',
    title: 'Comment aider vos parents à gérer leur administration',
    excerpt: 'Guide complet pour accompagner vos proches dans la gestion de leurs courriers et démarches administratives au quotidien.',
    category: 'Guide pratique',
    categoryColor: '#2563EB',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800',
    author: { name: 'Marie Dupont', avatar: '👩‍⚕️', bio: 'Experte en accompagnement des seniors' },
    publishedAt: '15 janvier 2024',
    content: [
      {
        type: 'intro',
        text: 'Accompagner ses parents dans la gestion de leur administration peut sembler complexe. Pourtant, avec les bonnes méthodes et un peu d\'organisation, vous pouvez les aider efficacement tout en préservant leur autonomie.',
      },
      {
        type: 'heading',
        text: '1. Établir un inventaire des documents',
      },
      {
        type: 'paragraph',
        text: 'Commencez par faire le point sur l\'ensemble des documents administratifs de vos parents. Identifiez les factures récurrentes, les contrats en cours, les correspondances avec les administrations, et les documents importants à conserver.',
      },
      {
        type: 'tip',
        text: 'Créez un classeur avec des intercalaires par catégorie : Santé, Banque, Impôts, Assurances, Énergie, etc.',
      },
      {
        type: 'heading',
        text: '2. Mettre en place un système de tri régulier',
      },
      {
        type: 'paragraph',
        text: 'Proposez à vos parents un rendez-vous hebdomadaire ou bimensuel pour trier le courrier ensemble. Ce rituel permet de :\n• Éviter l\'accumulation de papiers\n• Repérer les courriers urgents\n• Répondre aux demandes dans les délais\n• Maintenir un lien régulier',
      },
      {
        type: 'heading',
        text: '3. Identifier les signes d\'alerte',
      },
      {
        type: 'paragraph',
        text: 'Soyez attentif aux indices qui peuvent révéler des difficultés :\n• Factures impayées ou relances\n• Courriers ouverts mais non traités\n• Confusion sur les échéances\n• Méfiance excessive ou, au contraire, trop de confiance envers les sollicitations',
      },
      {
        type: 'warning',
        text: 'Attention aux arnaques par courrier ! Les faux courriers officiels sont de plus en plus sophistiqués. Vérifiez toujours l\'authenticité des demandes de paiement.',
      },
      {
        type: 'heading',
        text: '4. Utiliser les outils numériques adaptés',
      },
      {
        type: 'paragraph',
        text: 'Des applications comme MonAdmin peuvent grandement faciliter la gestion quotidienne. Elles permettent de :\n• Scanner et archiver les documents importants\n• Recevoir des rappels pour les échéances\n• Simplifier la compréhension des courriers complexes\n• Partager les informations avec les aidants',
      },
      {
        type: 'heading',
        text: '5. Préserver l\'autonomie de vos parents',
      },
      {
        type: 'paragraph',
        text: 'L\'objectif n\'est pas de tout faire à leur place, mais de les accompagner. Impliquez-les dans les décisions, expliquez les démarches, et laissez-les agir quand ils le peuvent. Cette approche respecte leur dignité et maintient leurs capacités cognitives.',
      },
      {
        type: 'quote',
        text: '"Aider ne signifie pas assister. C\'est donner les moyens d\'agir."',
        author: 'Association France Aidants',
      },
      {
        type: 'heading',
        text: 'Conclusion',
      },
      {
        type: 'paragraph',
        text: 'Accompagner ses parents dans leur administration demande de la patience et de l\'organisation. En mettant en place des routines simples et en utilisant les bons outils, vous pouvez leur apporter une aide précieuse tout en préservant leur autonomie. N\'hésitez pas à solliciter des professionnels (assistante sociale, CCAS) si la situation devient trop complexe.',
      },
    ],
    relatedArticles: ['2', '3', '5'],
  },
  '2': {
    id: '2',
    slug: 'organiser-documents-seniors',
    title: '10 conseils pour organiser les documents de vos parents',
    excerpt: 'Découvrez nos astuces pour classer efficacement factures, relevés bancaires et courriers importants.',
    category: 'Organisation',
    categoryColor: '#059669',
    readTime: 5,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    author: { name: 'Pierre Martin', avatar: '👨‍💼', bio: 'Consultant en organisation' },
    publishedAt: '12 janvier 2024',
    content: [
      {
        type: 'intro',
        text: 'Un système de classement efficace est la clé pour ne plus jamais perdre un document important. Voici 10 conseils pratiques testés et approuvés.',
      },
      {
        type: 'heading',
        text: '1. Choisir le bon système de classement',
      },
      {
        type: 'paragraph',
        text: 'Optez pour des classeurs à levier avec des intercalaires colorés. Chaque couleur correspond à une catégorie : vert pour la santé, bleu pour les finances, rouge pour les urgences...',
      },
    ],
    relatedArticles: ['1', '4'],
  },
  '3': {
    id: '3',
    slug: 'detecter-arnaques-courrier',
    title: 'Arnaques par courrier : comment protéger vos proches',
    excerpt: 'Les techniques des arnaqueurs évoluent. Apprenez à reconnaître les faux courriers officiels.',
    category: 'Sécurité',
    categoryColor: '#DC2626',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    author: { name: 'Sophie Leblanc', avatar: '👮‍♀️', bio: 'Spécialiste cybersécurité' },
    publishedAt: '10 janvier 2024',
    content: [
      {
        type: 'intro',
        text: 'Chaque année, des milliers de seniors sont victimes d\'arnaques par courrier. Voici comment les protéger.',
      },
    ],
    relatedArticles: ['1', '5'],
  },
};

export default function ArticleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const display = useDisplaySettings();
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const article = ARTICLES_DATA[id || '1'];

  if (!article) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: display.colors.background }}>
        <Text style={{ fontFamily: 'Nunito_600SemiBold', color: display.colors.text }}>
          Article non trouvé
        </Text>
      </View>
    );
  }

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${article.title}\n\nLisez cet article sur MonAdmin :\nhttps://monadmin.fr/blog/${article.slug}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const renderContent = (item: any, index: number) => {
    switch (item.type) {
      case 'intro':
        return (
          <Text
            key={index}
            className="mb-6"
            style={{
              fontFamily: 'Nunito_600SemiBold',
              fontSize: display.fontSize.lg,
              color: display.colors.text,
              lineHeight: 28,
            }}
          >
            {item.text}
          </Text>
        );
      case 'heading':
        return (
          <Text
            key={index}
            className="mt-6 mb-3"
            style={{
              fontFamily: 'Nunito_800ExtraBold',
              fontSize: display.fontSize.xl,
              color: display.colors.text,
            }}
          >
            {item.text}
          </Text>
        );
      case 'paragraph':
        return (
          <Text
            key={index}
            className="mb-4"
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: display.fontSize.base,
              color: display.colors.textSecondary,
              lineHeight: 26,
            }}
          >
            {item.text}
          </Text>
        );
      case 'tip':
        return (
          <View
            key={index}
            className="mb-4 p-4 rounded-2xl border-l-4"
            style={{
              backgroundColor: display.isDarkMode ? '#064E3B' : '#ECFDF5',
              borderLeftColor: '#059669',
            }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.sm,
                color: '#059669',
                marginBottom: 4,
              }}
            >
              💡 Conseil
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.sm,
                color: display.isDarkMode ? '#A7F3D0' : '#047857',
                lineHeight: 22,
              }}
            >
              {item.text}
            </Text>
          </View>
        );
      case 'warning':
        return (
          <View
            key={index}
            className="mb-4 p-4 rounded-2xl border-l-4"
            style={{
              backgroundColor: display.isDarkMode ? '#7F1D1D' : '#FEF2F2',
              borderLeftColor: '#DC2626',
            }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.sm,
                color: '#DC2626',
                marginBottom: 4,
              }}
            >
              ⚠️ Attention
            </Text>
            <Text
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.sm,
                color: display.isDarkMode ? '#FCA5A5' : '#991B1B',
                lineHeight: 22,
              }}
            >
              {item.text}
            </Text>
          </View>
        );
      case 'quote':
        return (
          <View
            key={index}
            className="mb-4 p-5 rounded-2xl"
            style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF' }}
          >
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: '#2563EB',
                fontStyle: 'italic',
                lineHeight: 26,
              }}
            >
              {item.text}
            </Text>
            {item.author && (
              <Text
                className="mt-2"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.sm,
                  color: display.colors.textMuted,
                }}
              >
                — {item.author}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: display.colors.background }}
        >
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-xl active:opacity-70"
            style={{ backgroundColor: display.isDarkMode ? '#374151' : '#F3F4F6' }}
          >
            <ChevronLeft size={24} color={display.colors.text} />
          </Pressable>
          <View className="flex-row">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSaved(!isSaved);
              }}
              className="p-2 rounded-xl mr-2"
              style={{ backgroundColor: display.isDarkMode ? '#374151' : '#F3F4F6' }}
            >
              <Bookmark
                size={22}
                color={isSaved ? '#F59E0B' : display.colors.text}
                fill={isSaved ? '#F59E0B' : 'transparent'}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="p-2 rounded-xl"
              style={{ backgroundColor: display.isDarkMode ? '#374151' : '#F3F4F6' }}
            >
              <Share2 size={22} color={display.colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image */}
          <Animated.View entering={FadeIn.duration(500)}>
            <Image
              source={{ uri: article.image }}
              style={{ width: '100%', height: 220 }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Content */}
          <View className="px-6 pt-6">
            {/* Category & read time */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-row items-center mb-3">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${article.categoryColor}20` }}
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: 12,
                    color: article.categoryColor,
                  }}
                >
                  {article.category}
                </Text>
              </View>
              <View className="flex-row items-center ml-3">
                <Clock size={14} color={display.colors.textMuted} />
                <Text
                  className="ml-1"
                  style={{
                    fontFamily: 'Nunito_400Regular',
                    fontSize: 12,
                    color: display.colors.textMuted,
                  }}
                >
                  {article.readTime} min de lecture
                </Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              entering={FadeInUp.duration(400).delay(200)}
              className="mb-4"
              style={{
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: 26,
                color: display.colors.text,
                lineHeight: 34,
              }}
            >
              {article.title}
            </Animated.Text>

            {/* Author */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(300)}
              className="flex-row items-center mb-6 pb-6 border-b"
              style={{ borderColor: display.isDarkMode ? '#374151' : '#E5E7EB' }}
            >
              <Text style={{ fontSize: 32 }}>{article.author.avatar}</Text>
              <View className="ml-3 flex-1">
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.base,
                    color: display.colors.text,
                  }}
                >
                  {article.author.name}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Nunito_400Regular',
                    fontSize: display.fontSize.xs,
                    color: display.colors.textMuted,
                  }}
                >
                  {article.author.bio} • {article.publishedAt}
                </Text>
              </View>
            </Animated.View>

            {/* Article content */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)}>
              {article.content?.map((item: any, index: number) => renderContent(item, index))}
            </Animated.View>

            {/* Actions */}
            <View
              className="flex-row items-center justify-center py-6 mt-6 border-t"
              style={{ borderColor: display.isDarkMode ? '#374151' : '#E5E7EB' }}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsLiked(!isLiked);
                }}
                className="flex-row items-center px-6 py-3 rounded-xl mr-4"
                style={{ backgroundColor: isLiked ? '#FEE2E2' : (display.isDarkMode ? '#374151' : '#F3F4F6') }}
              >
                <Heart
                  size={20}
                  color={isLiked ? '#DC2626' : display.colors.text}
                  fill={isLiked ? '#DC2626' : 'transparent'}
                />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: display.fontSize.sm,
                    color: isLiked ? '#DC2626' : display.colors.text,
                  }}
                >
                  {isLiked ? 'Merci !' : 'Utile'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="flex-row items-center px-6 py-3 rounded-xl"
                style={{ backgroundColor: display.isDarkMode ? '#374151' : '#F3F4F6' }}
              >
                <Share2 size={20} color={display.colors.text} />
                <Text
                  className="ml-2"
                  style={{
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: display.fontSize.sm,
                    color: display.colors.text,
                  }}
                >
                  Partager
                </Text>
              </Pressable>
            </View>

            {/* Related articles */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <View className="mt-4">
                <Text
                  className="mb-4"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.xl,
                    color: display.colors.text,
                  }}
                >
                  Articles similaires
                </Text>
                {article.relatedArticles.slice(0, 2).map((relatedId: string) => {
                  const related = ARTICLES_DATA[relatedId];
                  if (!related) return null;
                  return (
                    <Pressable
                      key={relatedId}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/article/${relatedId}` as any);
                      }}
                      className="flex-row items-center mb-3 p-3 rounded-2xl active:opacity-80"
                      style={{ backgroundColor: display.colors.card }}
                    >
                      <Image
                        source={{ uri: related.image }}
                        style={{ width: 60, height: 60, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          style={{
                            fontFamily: 'Nunito_700Bold',
                            fontSize: display.fontSize.sm,
                            color: display.colors.text,
                          }}
                          numberOfLines={2}
                        >
                          {related.title}
                        </Text>
                        <Text
                          className="mt-1"
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: display.fontSize.xs,
                            color: display.colors.textMuted,
                          }}
                        >
                          {related.readTime} min
                        </Text>
                      </View>
                      <ChevronRight size={20} color={display.colors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
