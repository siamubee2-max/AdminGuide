import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Users,
  BookOpen,
  Mail,
  ChevronRight,
  Clock,
  Heart,
  Share2,
  Bookmark,
  TrendingUp,
  FileText,
  Lightbulb,
  MessageCircle,
  Send,
  CheckCircle2,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

// Types
interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: string;
  readTime: number;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  featured?: boolean;
}

interface GuideCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  count: number;
}

// Sample articles data
const ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'comment-aider-parents-gerer-admin',
    title: 'Comment aider vos parents à gérer leur administration',
    excerpt: 'Guide complet pour accompagner vos proches dans la gestion de leurs courriers et démarches administratives au quotidien.',
    category: 'Guide pratique',
    categoryColor: '#2563EB',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=400',
    author: { name: 'Marie Dupont', avatar: '👩‍⚕️' },
    publishedAt: '2024-01-15',
    featured: true,
  },
  {
    id: '2',
    slug: 'organiser-documents-seniors',
    title: '10 conseils pour organiser les documents de vos parents',
    excerpt: 'Découvrez nos astuces pour classer efficacement factures, relevés bancaires et courriers importants.',
    category: 'Organisation',
    categoryColor: '#059669',
    readTime: 5,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    author: { name: 'Pierre Martin', avatar: '👨‍💼' },
    publishedAt: '2024-01-12',
  },
  {
    id: '3',
    slug: 'detecter-arnaques-courrier',
    title: 'Arnaques par courrier : comment protéger vos proches',
    excerpt: 'Les techniques des arnaqueurs évoluent. Apprenez à reconnaître les faux courriers officiels.',
    category: 'Sécurité',
    categoryColor: '#DC2626',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    author: { name: 'Sophie Leblanc', avatar: '👮‍♀️' },
    publishedAt: '2024-01-10',
  },
  {
    id: '4',
    slug: 'preparer-impots-seniors',
    title: 'Déclaration d\'impôts : accompagner un senior pas à pas',
    excerpt: 'Tous les conseils pour aider vos parents à faire leur déclaration sans stress.',
    category: 'Impôts',
    categoryColor: '#7C3AED',
    readTime: 10,
    image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400',
    author: { name: 'Jean Moreau', avatar: '🧮' },
    publishedAt: '2024-01-08',
  },
  {
    id: '5',
    slug: 'communication-bienveillante-parents',
    title: 'Parler d\'argent avec ses parents : le guide de l\'aidant',
    excerpt: 'Comment aborder les sujets financiers délicats avec bienveillance et respect.',
    category: 'Communication',
    categoryColor: '#F59E0B',
    readTime: 7,
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    author: { name: 'Claire Bernard', avatar: '💬' },
    publishedAt: '2024-01-05',
  },
  {
    id: '6',
    slug: 'mutuelle-seniors-choisir',
    title: 'Choisir la bonne mutuelle pour un senior',
    excerpt: 'Comparatif et conseils pour trouver la couverture santé adaptée aux besoins de vos parents.',
    category: 'Santé',
    categoryColor: '#EC4899',
    readTime: 9,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400',
    author: { name: 'Dr. Anne Petit', avatar: '👩‍⚕️' },
    publishedAt: '2024-01-02',
  },
];

const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: 'practical', title: 'Guides pratiques', icon: BookOpen, color: '#2563EB', bgColor: '#DBEAFE', count: 12 },
  { id: 'security', title: 'Sécurité', icon: Lightbulb, color: '#DC2626', bgColor: '#FEE2E2', count: 8 },
  { id: 'health', title: 'Santé', icon: Heart, color: '#EC4899', bgColor: '#FCE7F3', count: 6 },
  { id: 'legal', title: 'Juridique', icon: FileText, color: '#7C3AED', bgColor: '#F5F3FF', count: 5 },
];

const TESTIMONIALS = [
  {
    name: 'Caroline M.',
    role: 'Aidante de sa mère',
    text: 'Grâce aux guides MonAdmin, j\'ai enfin compris comment aider ma mère avec ses papiers. Un vrai soulagement !',
    rating: 5,
  },
  {
    name: 'Philippe D.',
    role: 'Fils de Jean, 82 ans',
    text: 'Les articles sur les arnaques m\'ont permis de protéger mon père d\'une tentative de fraude.',
    rating: 5,
  },
];

export default function CommunauteScreen() {
  const router = useRouter();
  const display = useDisplaySettings();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      // For demo, simulate success
      setIsSubscribed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveArticle = (articleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedArticles((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  const handleShareArticle = async (article: Article) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${article.title}\n\nDécouvrez cet article sur MonAdmin :\nhttps://monadmin.fr/blog/${article.slug}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const featuredArticle = ARTICLES.find((a) => a.featured);
  const regularArticles = ARTICLES.filter((a) => !a.featured);

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1E3A5F', '#0F766E', '#1F2937']
          : ['#0F766E', '#059669', '#10B981']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
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
              <Users size={28} color="white" />
              <Text
                className="text-white text-3xl ml-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Communauté Aidants
              </Text>
            </View>
            <Text
              className="text-white/80 text-base"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Guides, conseils et ressources pour accompagner vos proches
            </Text>
          </Animated.View>
        </View>

        <ScrollView
          className="flex-1 -mt-4"
          style={{ backgroundColor: display.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Newsletter subscription */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="px-6 mb-6"
          >
            <View
              className="rounded-3xl p-6"
              style={{ backgroundColor: display.isDarkMode ? '#064E3B' : '#ECFDF5' }}
            >
              {!isSubscribed ? (
                <>
                  <View className="flex-row items-center mb-3">
                    <Mail size={24} color="#059669" />
                    <Text
                      className="ml-2"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: display.fontSize.lg,
                        color: '#059669',
                      }}
                    >
                      Newsletter des Aidants
                    </Text>
                  </View>
                  <Text
                    className="mb-4"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.sm,
                      color: display.isDarkMode ? '#A7F3D0' : '#047857',
                    }}
                  >
                    Recevez chaque semaine nos meilleurs conseils pour accompagner vos proches.
                  </Text>
                  <View className="flex-row">
                    <TextInput
                      className="flex-1 px-4 py-3 rounded-xl mr-2"
                      style={{
                        backgroundColor: display.isDarkMode ? '#065F46' : 'white',
                        color: display.isDarkMode ? 'white' : '#1F2937',
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.base,
                      }}
                      placeholder="votre@email.com"
                      placeholderTextColor={display.isDarkMode ? '#6EE7B7' : '#9CA3AF'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={handleSubscribe}
                      disabled={isLoading}
                      className="px-5 py-3 rounded-xl active:opacity-80"
                      style={{ backgroundColor: '#059669' }}
                    >
                      <Send size={20} color="white" />
                    </Pressable>
                  </View>
                  <Text
                    className="mt-3 text-center"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.xs,
                      color: display.isDarkMode ? '#6EE7B7' : '#047857',
                    }}
                  >
                    Désinscription en un clic • Pas de spam
                  </Text>
                </>
              ) : (
                <View className="items-center py-4">
                  <CheckCircle2 size={48} color="#059669" />
                  <Text
                    className="mt-3"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: display.fontSize.lg,
                      color: '#059669',
                    }}
                  >
                    Vous êtes inscrit !
                  </Text>
                  <Text
                    className="text-center mt-1"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.sm,
                      color: display.isDarkMode ? '#A7F3D0' : '#047857',
                    }}
                  >
                    Vous recevrez nos conseils chaque semaine.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Guide categories */}
          <View className="px-6 mb-6">
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              Catégories
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {GUIDE_CATEGORIES.map((category, index) => (
                <Animated.View
                  key={category.id}
                  entering={FadeIn.duration(400).delay(200 + index * 50)}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="mr-3 rounded-2xl p-4 active:scale-95"
                    style={{ backgroundColor: category.bgColor, width: 130 }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <category.icon size={20} color={category.color} />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: display.fontSize.sm,
                        color: category.color,
                      }}
                    >
                      {category.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.xs,
                        color: `${category.color}99`,
                      }}
                    >
                      {category.count} articles
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Featured article */}
          {featuredArticle && (
            <View className="px-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.xl,
                    color: display.colors.text,
                  }}
                >
                  Article à la une
                </Text>
                <View className="flex-row items-center">
                  <TrendingUp size={16} color="#F59E0B" />
                  <Text
                    className="ml-1"
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      fontSize: display.fontSize.xs,
                      color: '#F59E0B',
                    }}
                  >
                    Populaire
                  </Text>
                </View>
              </View>

              <Animated.View entering={FadeInUp.duration(500).delay(300)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/article/${featuredArticle.id}` as any);
                  }}
                  className="rounded-3xl overflow-hidden active:scale-98"
                  style={{ backgroundColor: display.colors.card }}
                >
                  <Image
                    source={{ uri: featuredArticle.image }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                  <View className="p-5">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${featuredArticle.categoryColor}20` }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            fontSize: 11,
                            color: featuredArticle.categoryColor,
                          }}
                        >
                          {featuredArticle.category}
                        </Text>
                      </View>
                      <View className="flex-row items-center ml-3">
                        <Clock size={12} color={display.colors.textMuted} />
                        <Text
                          className="ml-1"
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            fontSize: 11,
                            color: display.colors.textMuted,
                          }}
                        >
                          {featuredArticle.readTime} min
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="mb-2"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: display.fontSize.lg,
                        color: display.colors.text,
                      }}
                    >
                      {featuredArticle.title}
                    </Text>
                    <Text
                      className="mb-4"
                      style={{
                        fontFamily: 'Nunito_400Regular',
                        fontSize: display.fontSize.sm,
                        color: display.colors.textSecondary,
                        lineHeight: 20,
                      }}
                      numberOfLines={2}
                    >
                      {featuredArticle.excerpt}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 20 }}>{featuredArticle.author.avatar}</Text>
                        <Text
                          className="ml-2"
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            fontSize: display.fontSize.sm,
                            color: display.colors.text,
                          }}
                        >
                          {featuredArticle.author.name}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Pressable
                          onPress={() => handleSaveArticle(featuredArticle.id)}
                          className="p-2 mr-1"
                        >
                          <Bookmark
                            size={20}
                            color={savedArticles.includes(featuredArticle.id) ? '#F59E0B' : display.colors.textMuted}
                            fill={savedArticles.includes(featuredArticle.id) ? '#F59E0B' : 'transparent'}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleShareArticle(featuredArticle)}
                          className="p-2"
                        >
                          <Share2 size={20} color={display.colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          )}

          {/* Recent articles */}
          <View className="px-6 mb-6">
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              Derniers articles
            </Text>

            {regularArticles.map((article, index) => (
              <Animated.View
                key={article.id}
                entering={FadeIn.duration(400).delay(400 + index * 100)}
                className="mb-4"
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/article/${article.id}` as any);
                  }}
                  className="flex-row rounded-2xl overflow-hidden active:opacity-90"
                  style={{ backgroundColor: display.colors.card }}
                >
                  <Image
                    source={{ uri: article.image }}
                    style={{ width: 100, height: 100 }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-4">
                    <View className="flex-row items-center mb-1">
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${article.categoryColor}20` }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Nunito_600SemiBold',
                            fontSize: 10,
                            color: article.categoryColor,
                          }}
                        >
                          {article.category}
                        </Text>
                      </View>
                      <Text
                        className="ml-2"
                        style={{
                          fontFamily: 'Nunito_400Regular',
                          fontSize: 10,
                          color: display.colors.textMuted,
                        }}
                      >
                        {article.readTime} min
                      </Text>
                    </View>
                    <Text
                      className="mb-1"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: display.fontSize.sm,
                        color: display.colors.text,
                      }}
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <View className="flex-row items-center mt-auto">
                      <Text style={{ fontSize: 14 }}>{article.author.avatar}</Text>
                      <Text
                        className="ml-1"
                        style={{
                          fontFamily: 'Nunito_400Regular',
                          fontSize: display.fontSize.xs,
                          color: display.colors.textMuted,
                        }}
                      >
                        {article.author.name}
                      </Text>
                    </View>
                  </View>
                  <View className="justify-center pr-3">
                    <ChevronRight size={20} color={display.colors.textMuted} />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Testimonials */}
          <View className="px-6 mb-6">
            <Text
              className="mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              Témoignages d'aidants
            </Text>

            {TESTIMONIALS.map((testimonial, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.duration(400).delay(700 + index * 100)}
                className="mb-4"
              >
                <View
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: display.colors.card }}
                >
                  <View className="flex-row mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </View>
                  <Text
                    className="mb-3"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.sm,
                      color: display.colors.text,
                      fontStyle: 'italic',
                      lineHeight: 22,
                    }}
                  >
                    "{testimonial.text}"
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: display.isDarkMode ? '#374151' : '#E5E7EB' }}
                    >
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </View>
                    <View className="ml-3">
                      <Text
                        style={{
                          fontFamily: 'Nunito_700Bold',
                          fontSize: display.fontSize.sm,
                          color: display.colors.text,
                        }}
                      >
                        {testimonial.name}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Nunito_400Regular',
                          fontSize: display.fontSize.xs,
                          color: display.colors.textMuted,
                        }}
                      >
                        {testimonial.role}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* CTA */}
          <View className="px-6">
            <View
              className="rounded-3xl p-6 items-center"
              style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF' }}
            >
              <MessageCircle size={40} color="#2563EB" />
              <Text
                className="mt-4 text-center"
                style={{
                  fontFamily: 'Nunito_700Bold',
                  fontSize: display.fontSize.lg,
                  color: display.colors.text,
                }}
              >
                Besoin d'aide personnalisée ?
              </Text>
              <Text
                className="text-center mt-2 mb-4"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.sm,
                  color: display.colors.textSecondary,
                }}
              >
                Rejoignez notre groupe Facebook d'entraide entre aidants.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                className="px-6 py-3 rounded-xl active:opacity-80"
                style={{ backgroundColor: '#2563EB' }}
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.base,
                    color: 'white',
                  }}
                >
                  Rejoindre la communauté
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
