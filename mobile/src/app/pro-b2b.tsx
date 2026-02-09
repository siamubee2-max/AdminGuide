import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Building2,
  Users,
  Shield,
  BarChart3,
  Headphones,
  Check,
  Phone,
  Mail,
  Send,
  Star,
  Clock,
  FileText,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNote: string;
  residents: string;
  features: string[];
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Pour les petites structures',
    price: '49€',
    priceNote: '/mois',
    residents: 'Jusqu\'à 20 résidents',
    features: [
      'Scan illimité de courriers',
      'Analyse IA des documents',
      'Alertes échéances',
      'Support email',
      '1 compte gestionnaire',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les résidences seniors',
    price: '99€',
    priceNote: '/mois',
    residents: 'Jusqu\'à 50 résidents',
    features: [
      'Tout Starter +',
      'Dashboard multi-résidents',
      'Notifications familles',
      'Export rapports PDF',
      '3 comptes gestionnaires',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les EHPAD & groupes',
    price: '199€',
    priceNote: '/mois',
    residents: 'Jusqu\'à 150 résidents',
    features: [
      'Tout Pro +',
      'Multi-établissements',
      'API & intégrations',
      'Formation sur site',
      'Gestionnaires illimités',
      'Account manager dédié',
      'SLA garanti 99.9%',
    ],
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Gestion centralisée',
    description: 'Tous les courriers de vos résidents en un seul endroit',
  },
  {
    icon: Clock,
    title: 'Alertes automatiques',
    description: 'Ne ratez plus aucune échéance importante',
  },
  {
    icon: Users,
    title: 'Lien avec les familles',
    description: 'Partagez les infos importantes avec les proches',
  },
  {
    icon: BarChart3,
    title: 'Rapports & statistiques',
    description: 'Suivez l\'activité administrative de votre structure',
  },
  {
    icon: Shield,
    title: 'Sécurité renforcée',
    description: 'Données hébergées en France, conformité RGPD',
  },
  {
    icon: Headphones,
    title: 'Support dédié',
    description: 'Une équipe à votre écoute pour vous accompagner',
  },
];

const TESTIMONIALS = [
  {
    name: 'Marie D.',
    role: 'Directrice, Résidence Les Jardins',
    text: 'MonAdmin Pro nous fait gagner 2h par jour sur la gestion du courrier. Les familles sont ravies d\'être informées en temps réel.',
    rating: 5,
  },
  {
    name: 'Jean-Pierre L.',
    role: 'Responsable admin, EHPAD Bellevue',
    text: 'Fini les courriers perdus et les échéances oubliées. L\'outil est simple et nos aides-soignants l\'ont adopté immédiatement.',
    rating: 5,
  },
];

export default function ProB2BScreen() {
  const router = useRouter();
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    structure: '',
    name: '',
    email: '',
    phone: '',
    residents: '',
    message: '',
  });

  const handleSubmitContact = async () => {
    if (!formData.structure || !formData.name || !formData.email) {
      Alert.alert('Champs requis', 'Veuillez remplir au moins le nom de votre structure, votre nom et email.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(`${BACKEND_URL}/api/b2b/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Demande envoyée !',
          'Notre équipe commerciale vous contactera sous 24h pour organiser une démonstration.',
          [{ text: 'OK', onPress: () => setShowContactForm(false) }]
        );
        setFormData({
          structure: '',
          name: '',
          email: '',
          phone: '',
          residents: '',
          message: '',
        });
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      // Fallback: open email
      const subject = encodeURIComponent('Demande de démo MonAdmin Pro');
      const body = encodeURIComponent(
        `Structure: ${formData.structure}\nNom: ${formData.name}\nEmail: ${formData.email}\nTéléphone: ${formData.phone}\nNombre de résidents: ${formData.residents}\n\nMessage: ${formData.message}`
      );
      Linking.openURL(`mailto:pro@monadmin.fr?subject=${subject}&body=${body}`);
      Alert.alert('Email', 'Votre client email va s\'ouvrir pour envoyer votre demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallSales = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('tel:+33123456789');
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#1E3A5F', '#2563EB', '#3B82F6']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
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
            <View className="flex-row items-center mb-3">
              <Building2 size={28} color="white" />
              <Text
                className="text-white text-3xl ml-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                MonAdmin Pro
              </Text>
            </View>
            <Text
              className="text-white/80 text-lg"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              La solution pour les professionnels du grand âge
            </Text>
          </Animated.View>
        </View>

        <ScrollView
          className="flex-1 bg-white rounded-t-3xl -mt-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero stats */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="px-6 py-8"
          >
            <View className="flex-row justify-between">
              {[
                { value: '2h', label: 'gagnées/jour' },
                { value: '98%', label: 'satisfaction' },
                { value: '150+', label: 'établissements' },
              ].map((stat, index) => (
                <View key={index} className="items-center flex-1">
                  <Text
                    className="text-3xl text-blue-600"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className="text-gray-500 text-sm text-center"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Value proposition */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="px-6 mb-8"
          >
            <View
              className="rounded-3xl p-6"
              style={{ backgroundColor: '#EFF6FF' }}
            >
              <Text
                className="text-xl text-gray-800 mb-3"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Simplifiez la gestion administrative de vos résidents
              </Text>
              <Text
                className="text-gray-600 leading-6"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                EHPAD, résidences seniors, services d'aide à domicile : MonAdmin Pro centralise
                et automatise le traitement des courriers de vos bénéficiaires. Scannez, analysez,
                alertez les familles — tout en un clic.
              </Text>
            </View>
          </Animated.View>

          {/* Features grid */}
          <View className="px-6 mb-8">
            <Text
              className="text-xl text-gray-800 mb-4"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Fonctionnalités Pro
            </Text>
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              {FEATURES.map((feature, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.duration(400).delay(300 + index * 50)}
                  style={{ width: '50%', padding: 6 }}
                >
                  <View
                    className="rounded-2xl p-4 h-36"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: '#DBEAFE' }}
                    >
                      <feature.icon size={20} color="#2563EB" />
                    </View>
                    <Text
                      className="text-gray-800 mb-1"
                      style={{ fontFamily: 'Nunito_700Bold', fontSize: 14 }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      className="text-gray-500 text-xs"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View className="px-6 mb-8">
            <Text
              className="text-xl text-gray-800 mb-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Tarifs adaptés à votre structure
            </Text>
            <Text
              className="text-gray-500 mb-4"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Sans engagement, résiliable à tout moment
            </Text>

            {PRICING_PLANS.map((plan, index) => (
              <Animated.View
                key={plan.id}
                entering={FadeInUp.duration(400).delay(400 + index * 100)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowContactForm(true);
                  }}
                  className="rounded-3xl p-5 mb-4 active:scale-[0.98]"
                  style={{
                    backgroundColor: plan.popular ? '#1E40AF' : '#FFFFFF',
                    borderWidth: plan.popular ? 0 : 2,
                    borderColor: '#E5E7EB',
                  }}
                >
                  {plan.popular && (
                    <View
                      className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#FEF3C7' }}
                    >
                      <Text
                        className="text-xs"
                        style={{ fontFamily: 'Nunito_700Bold', color: '#92400E' }}
                      >
                        POPULAIRE
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-start justify-between mb-3">
                    <View>
                      <Text
                        className="text-xl"
                        style={{
                          fontFamily: 'Nunito_800ExtraBold',
                          color: plan.popular ? 'white' : '#1F2937',
                        }}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{
                          fontFamily: 'Nunito_400Regular',
                          color: plan.popular ? 'rgba(255,255,255,0.7)' : '#6B7280',
                        }}
                      >
                        {plan.description}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-baseline">
                        <Text
                          className="text-3xl"
                          style={{
                            fontFamily: 'Nunito_800ExtraBold',
                            color: plan.popular ? 'white' : '#2563EB',
                          }}
                        >
                          {plan.price}
                        </Text>
                        <Text
                          className="text-sm ml-1"
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            color: plan.popular ? 'rgba(255,255,255,0.7)' : '#6B7280',
                          }}
                        >
                          {plan.priceNote}
                        </Text>
                      </View>
                      <Text
                        className="text-xs"
                        style={{
                          fontFamily: 'Nunito_600SemiBold',
                          color: plan.popular ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                        }}
                      >
                        {plan.residents}
                      </Text>
                    </View>
                  </View>

                  <View className="border-t pt-3 mt-2" style={{ borderColor: plan.popular ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }}>
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <View key={i} className="flex-row items-center mb-2">
                        <Check size={16} color={plan.popular ? '#34D399' : '#10B981'} />
                        <Text
                          className="text-sm ml-2"
                          style={{
                            fontFamily: 'Nunito_400Regular',
                            color: plan.popular ? 'rgba(255,255,255,0.9)' : '#4B5563',
                          }}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                    {plan.features.length > 4 && (
                      <Text
                        className="text-xs mt-1"
                        style={{
                          fontFamily: 'Nunito_600SemiBold',
                          color: plan.popular ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                        }}
                      >
                        + {plan.features.length - 4} autres fonctionnalités
                      </Text>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            <Text
              className="text-center text-gray-400 text-xs mt-2"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Tarifs dégressifs pour les groupes multi-établissements
            </Text>
          </View>

          {/* Testimonials */}
          <View className="px-6 mb-8">
            <Text
              className="text-xl text-gray-800 mb-4"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Ils nous font confiance
            </Text>

            {TESTIMONIALS.map((testimonial, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.duration(400).delay(600 + index * 100)}
                className="rounded-2xl p-5 mb-3"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <View className="flex-row mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>
                <Text
                  className="text-gray-700 mb-3 italic"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  "{testimonial.text}"
                </Text>
                <View>
                  <Text
                    className="text-gray-800"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {testimonial.name}
                  </Text>
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {testimonial.role}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Contact form */}
          {showContactForm && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="px-6 mb-8"
            >
              <View
                className="rounded-3xl p-6"
                style={{ backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#BBF7D0' }}
              >
                <Text
                  className="text-xl text-gray-800 mb-1"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Demander une démo gratuite
                </Text>
                <Text
                  className="text-gray-500 mb-4"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Notre équipe vous recontacte sous 24h
                </Text>

                <View className="space-y-3">
                  <TextInput
                    value={formData.structure}
                    onChangeText={(text) => setFormData({ ...formData, structure: text })}
                    placeholder="Nom de votre établissement *"
                    placeholderTextColor="#9CA3AF"
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Votre nom *"
                    placeholderTextColor="#9CA3AF"
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="Email professionnel *"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="Téléphone"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                  <TextInput
                    value={formData.residents}
                    onChangeText={(text) => setFormData({ ...formData, residents: text })}
                    placeholder="Nombre de résidents/bénéficiaires"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                  <TextInput
                    value={formData.message}
                    onChangeText={(text) => setFormData({ ...formData, message: text })}
                    placeholder="Message (optionnel)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    className="bg-white rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Nunito_400Regular', minHeight: 80, textAlignVertical: 'top' }}
                  />
                </View>

                <Pressable
                  onPress={handleSubmitContact}
                  disabled={isSubmitting}
                  className="mt-4 rounded-xl py-4 flex-row items-center justify-center active:scale-[0.98]"
                  style={{ backgroundColor: '#059669' }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Send size={20} color="white" />
                      <Text
                        className="text-white text-lg ml-2"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Envoyer ma demande
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* CTA */}
          <View className="px-6">
            <View
              className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: '#1E3A5F' }}
            >
              <LinearGradient
                colors={['#1E3A5F', '#1E40AF']}
                style={{ padding: 24 }}
              >
                <Heart size={32} color="#F472B6" style={{ marginBottom: 12 }} />
                <Text
                  className="text-2xl text-white mb-2"
                  style={{ fontFamily: 'Nunito_800ExtraBold' }}
                >
                  Prêt à simplifier votre quotidien ?
                </Text>
                <Text
                  className="text-white/70 mb-6"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Essai gratuit 30 jours, sans engagement, sans carte bancaire
                </Text>

                <View className="flex-row">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowContactForm(true);
                    }}
                    className="flex-1 rounded-xl py-4 mr-2 items-center active:scale-[0.98]"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Text
                      className="text-lg"
                      style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}
                    >
                      Demander une démo
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCallSales}
                    className="w-14 rounded-xl items-center justify-center active:scale-[0.98]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Phone size={24} color="white" />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
