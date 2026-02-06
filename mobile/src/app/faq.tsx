import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

interface FAQItem {
  question: string;
  answer: string;
  icon: string;
}

const FAQ_CATEGORIES: { title: string; color: string; bgColor: string; bgColorDark: string; items: FAQItem[] }[] = [
  {
    title: "Utilisation generale",
    color: '#2563EB',
    bgColor: '#DBEAFE',
    bgColorDark: '#1E3A5F',
    items: [
      {
        question: "Comment scanner un courrier ?",
        answer: "Appuyez sur le bouton 'Scanner un courrier' sur l'ecran d'accueil ou allez dans l'onglet Scanner. Placez votre document bien a plat, assurez-vous que le texte est lisible, puis appuyez sur le bouton vert pour prendre la photo. MonAdmin analysera automatiquement votre document.",
        icon: '📷',
      },
      {
        question: "Comment faire lire un courrier a voix haute ?",
        answer: "Apres avoir scanne un document, un lecteur audio apparait sur la page de resultat. Vous pouvez choisir entre 'Courrier complet' pour entendre le texte integral, ou 'Resume simplifie' pour une version courte. Appuyez sur 'Lire a voix haute' pour lancer la lecture.",
        icon: '🔊',
      },
      {
        question: "Puis-je utiliser MonAdmin sans internet ?",
        answer: "Vous avez besoin d'internet pour scanner et analyser de nouveaux documents. Cependant, tous les documents deja analyses sont sauvegardes localement et restent consultables sans connexion. Les rappels fonctionnent aussi hors ligne.",
        icon: '📶',
      },
    ],
  },
  {
    title: "Documents et analyse",
    color: '#10B981',
    bgColor: '#D1FAE5',
    bgColorDark: '#064E3B',
    items: [
      {
        question: "L'analyse est-elle fiable a 100% ?",
        answer: "L'intelligence artificielle fournit une aide a la comprehension mais n'est pas infaillible. Pour les documents importants (impots, litiges, montants eleves), nous vous recommandons de verifier les informations aupres de l'organisme concerne ou de demander l'aide d'un proche.",
        icon: '🤖',
      },
      {
        question: "Quels types de documents puis-je scanner ?",
        answer: "MonAdmin peut analyser la plupart des documents administratifs : factures, courriers de mutuelle, releves bancaires, convocations, attestations, contrats, courriers de pension, lettres d'organismes publics, etc.",
        icon: '📄',
      },
      {
        question: "Comment retrouver un ancien document ?",
        answer: "Allez dans l'onglet 'Documents' en bas de l'ecran. Vous pouvez filtrer par categorie (Sante, Energie, Pension, Banque) ou utiliser la barre de recherche pour trouver un document specifique.",
        icon: '🔍',
      },
      {
        question: "Comment archiver un document ?",
        answer: "Sur la page de resultat d'un document, faites defiler vers le bas et appuyez sur 'Archiver ce document'. Le document sera deplace dans vos archives et ne sera plus visible dans la liste principale.",
        icon: '📁',
      },
    ],
  },
  {
    title: "Rappels et notifications",
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    bgColorDark: '#78350F',
    items: [
      {
        question: "Comment programmer un rappel ?",
        answer: "Sur la page de resultat d'un document, appuyez sur 'Me rappeler plus tard'. Vous pouvez choisir : demain matin, dans 3 jours, dans une semaine, ou des rappels automatiques bases sur la date limite du document.",
        icon: '🔔',
      },
      {
        question: "Comment annuler un rappel ?",
        answer: "Les rappels programmes apparaissent en haut de la page de resultat du document. Appuyez sur la croix a cote du rappel pour le supprimer. Vous pouvez aussi modifier les preferences de rappel dans Reglages > Notifications.",
        icon: '🚫',
      },
    ],
  },
  {
    title: "Famille et partage",
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    bgColorDark: '#312E81',
    items: [
      {
        question: "Comment ajouter un aidant ?",
        answer: "Allez dans Reglages > Ma famille, puis appuyez sur 'Ajouter un aidant'. Renseignez le prenom, le numero de telephone et l'email de votre proche. Il pourra recevoir des alertes en cas de courrier urgent.",
        icon: '👨‍👩‍👧',
      },
      {
        question: "Comment partager un document avec ma famille ?",
        answer: "Sur la page de resultat d'un document, appuyez sur 'Partager avec ma famille'. Selectionnez la personne avec qui vous souhaitez partager le document.",
        icon: '📤',
      },
    ],
  },
  {
    title: "Accessibilite et reglages",
    color: '#EF4444',
    bgColor: '#FEE2E2',
    bgColorDark: '#7F1D1D',
    items: [
      {
        question: "Comment agrandir le texte ?",
        answer: "Allez dans Reglages > Affichage. Vous pouvez choisir entre trois tailles de texte : Normal, Grand et Tres grand. Un apercu en direct vous montre le resultat.",
        icon: '🔤',
      },
      {
        question: "Comment activer le mode sombre ?",
        answer: "Allez dans Reglages > Affichage, puis choisissez le theme 'Sombre'. Vous pouvez aussi activer le 'Contraste eleve' pour des couleurs plus marquees.",
        icon: '🌙',
      },
      {
        question: "Comment changer la vitesse de lecture vocale ?",
        answer: "Allez dans Reglages > Son et voix. Vous pouvez regler la vitesse (Lent, Normal, Rapide) et le volume de la voix.",
        icon: '⚡',
      },
    ],
  },
];

function FAQAccordion({ item, display }: { item: FAQItem; display: ReturnType<typeof useDisplaySettings> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setIsOpen(!isOpen)}
      className="rounded-xl overflow-hidden mb-3"
      style={{
        backgroundColor: display.colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: display.isDarkMode ? 0.2 : 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="p-4 flex-row items-center">
        <Text style={{ fontSize: 22, marginRight: 12 }}>{item.icon}</Text>
        <Text
          className="flex-1"
          style={{
            fontFamily: 'Nunito_600SemiBold',
            fontSize: display.fontSize.base,
            color: display.colors.text,
          }}
        >
          {item.question}
        </Text>
        {isOpen
          ? <ChevronUp size={20} color={display.colors.textMuted} />
          : <ChevronDown size={20} color={display.colors.textMuted} />
        }
      </View>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View
            className="px-4 pb-4 pt-0"
            style={{ borderTopWidth: 1, borderTopColor: display.colors.border }}
          >
            <Text
              className="pt-3"
              style={{
                fontFamily: 'Nunito_400Regular',
                fontSize: display.fontSize.base,
                color: display.colors.textSecondary,
                lineHeight: display.fontSize.base * 1.6,
              }}
            >
              {item.answer}
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function FAQScreen() {
  const router = useRouter();
  const display = useDisplaySettings();

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode
          ? ['#1F2937', '#111827', '#0F172A']
          : ['#ECFDF5', '#D1FAE5', '#FFFFFF']}
        locations={[0, 0.25, 0.6]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-2 flex-row items-center"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center active:opacity-70"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: display.isDarkMode ? '#064E3B' : '#D1FAE5' }}
            >
              <ChevronLeft size={24} color="#10B981" />
            </View>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: display.fontSize.lg,
                color: '#10B981',
              }}
            >
              Retour
            </Text>
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-6 pb-5"
        >
          <View className="flex-row items-center">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: display.isDarkMode ? '#064E3B' : '#D1FAE5' }}
            >
              <HelpCircle size={28} color="#10B981" />
            </View>
            <View className="ml-4 flex-1">
              <Text
                style={{
                  fontFamily: 'Nunito_800ExtraBold',
                  fontSize: display.fontSize['2xl'],
                  color: display.colors.text,
                }}
              >
                Questions frequentes
              </Text>
              <Text
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.sm,
                  color: display.colors.textMuted,
                  marginTop: 2,
                }}
              >
                Trouvez rapidement une reponse
              </Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {FAQ_CATEGORIES.map((category, catIndex) => (
            <Animated.View
              key={category.title}
              entering={FadeInUp.duration(400).delay(150 + catIndex * 60)}
              className="mb-6"
            >
              {/* Category header */}
              <View className="flex-row items-center mb-3">
                <View
                  className="h-1 flex-1 rounded-full mr-3"
                  style={{ backgroundColor: category.color, opacity: 0.3 }}
                />
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.lg,
                    color: category.color,
                  }}
                >
                  {category.title}
                </Text>
                <View
                  className="h-1 flex-1 rounded-full ml-3"
                  style={{ backgroundColor: category.color, opacity: 0.3 }}
                />
              </View>

              {/* FAQ items */}
              {category.items.map((item) => (
                <FAQAccordion
                  key={item.question}
                  item={item}
                  display={display}
                />
              ))}
            </Animated.View>
          ))}

          {/* Contact CTA */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)}>
            <View
              className="rounded-2xl p-6 items-center"
              style={{
                backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF',
                borderWidth: 1,
                borderColor: display.isDarkMode ? '#2563EB' : '#BFDBFE',
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text
                className="text-center mb-2"
                style={{
                  fontFamily: 'Nunito_700Bold',
                  fontSize: display.fontSize.lg,
                  color: display.colors.text,
                }}
              >
                Vous n'avez pas trouve de reponse ?
              </Text>
              <Text
                className="text-center"
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: display.fontSize.base,
                  color: display.colors.textSecondary,
                  lineHeight: display.fontSize.base * 1.5,
                }}
              >
                N'hesitez pas a demander de l'aide a un proche ou a nous contacter via la section "A propos" dans les reglages.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
