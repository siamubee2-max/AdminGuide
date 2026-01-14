import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Eye, 
  Volume2, 
  Bell, 
  Users, 
  Info,
  Check,
  Trash2,
  Plus,
  Phone,
  Mail,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
  useSettingsStore, 
  FontSize, 
  VoiceSpeed,
} from '@/lib/state/settings-store';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

type Section = 'main' | 'profil' | 'affichage' | 'son' | 'notifications' | 'famille' | 'apropos';

export default function ReglagesScreen() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section>('main');
  
  const settings = useSettingsStore();
  const display = useDisplaySettings();
  
  const navigateToSection = (section: Section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSection(section);
  };

  const goBack = () => {
    if (currentSection === 'main') {
      router.back();
    } else {
      setCurrentSection('main');
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'profil': return 'Mon profil';
      case 'affichage': return 'Affichage';
      case 'son': return 'Son et voix';
      case 'notifications': return 'Notifications';
      case 'famille': return 'Ma famille';
      case 'apropos': return 'À propos';
      default: return 'Réglages';
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: display.colors.background }}>
      <LinearGradient
        colors={display.isDarkMode 
          ? ['#1F2937', '#111827', '#0F172A']
          : ['#F5F3FF', '#FFFBF5', '#FFFFFF']}
        locations={[0, 0.2, 0.5]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4 flex-row items-center"
        >
          <Pressable
            onPress={goBack}
            className="flex-row items-center active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: display.isDarkMode ? '#1E3A5F' : '#EFF6FF' }}
            >
              <ChevronLeft size={24} color={display.colors.primary} />
            </View>
            <Text
              style={{ 
                fontFamily: 'Nunito_600SemiBold', 
                fontSize: display.fontSize.lg,
                color: display.colors.primary,
              }}
            >
              {currentSection === 'main' ? 'Retour' : 'Réglages'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-6 pb-6"
        >
          <View className="flex-row items-center">
            <Text style={{ fontSize: 32 }}>⚙️</Text>
            <Text
              className="ml-3"
              style={{ 
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: display.fontSize['3xl'],
                color: display.colors.text,
              }}
            >
              {getSectionTitle()}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {currentSection === 'main' && (
            <MainSection onNavigate={navigateToSection} display={display} />
          )}
          {currentSection === 'profil' && (
            <ProfilSection settings={settings} />
          )}
          {currentSection === 'affichage' && (
            <AffichageSection settings={settings} />
          )}
          {currentSection === 'son' && (
            <SonSection settings={settings} />
          )}
          {currentSection === 'notifications' && (
            <NotificationsSection settings={settings} />
          )}
          {currentSection === 'famille' && (
            <FamilleSection settings={settings} />
          )}
          {currentSection === 'apropos' && (
            <AProposSection />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Section principale avec liste des catégories
function MainSection({ onNavigate, display }: { onNavigate: (section: Section) => void; display: ReturnType<typeof useDisplaySettings> }) {
  const menuItems = [
    { id: 'profil' as Section, icon: User, label: 'Mon profil', emoji: '👤', color: '#2563EB', bg: '#DBEAFE', bgDark: '#1E3A5F' },
    { id: 'affichage' as Section, icon: Eye, label: 'Affichage', emoji: '👁️', color: '#7C3AED', bg: '#F5F3FF', bgDark: '#312E81' },
    { id: 'son' as Section, icon: Volume2, label: 'Son et voix', emoji: '🔊', color: '#F59E0B', bg: '#FEF3C7', bgDark: '#78350F' },
    { id: 'notifications' as Section, icon: Bell, label: 'Notifications', emoji: '🔔', color: '#EF4444', bg: '#FEE2E2', bgDark: '#7F1D1D' },
    { id: 'famille' as Section, icon: Users, label: 'Ma famille', emoji: '👨‍👩‍👧', color: '#10B981', bg: '#D1FAE5', bgDark: '#064E3B' },
    { id: 'apropos' as Section, icon: Info, label: 'À propos', emoji: 'ℹ️', color: '#6B7280', bg: '#F3F4F6', bgDark: '#374151' },
  ];

  return (
    <View className="space-y-3">
      {menuItems.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInUp.duration(400).delay(index * 80)}
        >
          <Pressable
            onPress={() => onNavigate(item.id)}
            className="rounded-2xl p-5 flex-row items-center active:scale-[0.98]"
            style={{
              backgroundColor: display.colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: display.isDarkMode ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: display.isDarkMode ? item.bgDark : item.bg }}
            >
              <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            </View>
            <Text
              className="flex-1 ml-4"
              style={{ 
                fontFamily: 'Nunito_700Bold',
                fontSize: display.fontSize.xl,
                color: display.colors.text,
              }}
            >
              {item.label}
            </Text>
            <ChevronRight size={24} color={display.colors.textMuted} />
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

// Section Profil
function ProfilSection({ settings }: { settings: ReturnType<typeof useSettingsStore> }) {
  const [prenom, setPrenom] = useState(settings.profile.prenom);
  const [nom, setNom] = useState(settings.profile.nom);
  const [telephone, setTelephone] = useState(settings.profile.telephone);
  const [adresse, setAdresse] = useState(settings.profile.adresse);

  const handleSave = () => {
    settings.updateProfile({ prenom, nom, telephone, adresse });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const avatars = ['👵', '👴', '🧓', '👩‍🦳', '👨‍🦳', '😊'];

  return (
    <View className="space-y-5">
      {/* Avatar picker */}
      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
          Votre avatar
        </Text>
        <View className="flex-row justify-around">
          {avatars.map((avatar) => (
            <Pressable
              key={avatar}
              onPress={() => settings.updateProfile({ avatar })}
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor: settings.profile.avatar === avatar ? '#DBEAFE' : '#F3F4F6',
                borderWidth: settings.profile.avatar === avatar ? 3 : 0,
                borderColor: '#2563EB',
              }}
            >
              <Text style={{ fontSize: 36 }}>{avatar}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Form fields */}
      <View className="bg-white rounded-2xl p-5 space-y-4">
        <InputField label="Prénom" value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" />
        <InputField label="Nom" value={nom} onChangeText={setNom} placeholder="Votre nom" />
        <InputField label="Téléphone" value={telephone} onChangeText={setTelephone} placeholder="06 12 34 56 78" keyboardType="phone-pad" />
        <InputField label="Adresse" value={adresse} onChangeText={setAdresse} placeholder="Votre adresse complète" multiline />
      </View>

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        className="bg-primary rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
        style={{ backgroundColor: '#2563EB' }}
      >
        <Check size={24} color="white" />
        <Text className="text-xl text-white ml-3" style={{ fontFamily: 'Nunito_700Bold' }}>
          Enregistrer
        </Text>
      </Pressable>
    </View>
  );
}

// Section Affichage
function AffichageSection({ settings }: { settings: ReturnType<typeof useSettingsStore> }) {
  const fontSizes: { id: FontSize; label: string; sampleSize: number }[] = [
    { id: 'normal', label: 'Normal', sampleSize: 16 },
    { id: 'grand', label: 'Grand', sampleSize: 19 },
    { id: 'tres_grand', label: 'Très grand', sampleSize: 22 },
  ];

  // Preview colors based on current settings
  const getPreviewColors = () => {
    if (settings.modeSombre) {
      return settings.contrasteEleve 
        ? { bg: '#000000', text: '#FFFFFF', card: '#111827' }
        : { bg: '#111827', text: '#F9FAFB', card: '#1F2937' };
    }
    return settings.contrasteEleve
      ? { bg: '#FFFFFF', text: '#000000', card: '#FFFFFF' }
      : { bg: '#FFFBF5', text: '#1F2937', card: '#FFFFFF' };
  };

  const previewColors = getPreviewColors();

  return (
    <View className="space-y-5">
      {/* Aperçu en direct */}
      <View 
        className="rounded-2xl p-5 overflow-hidden"
        style={{ 
          backgroundColor: previewColors.bg,
          borderWidth: 2,
          borderColor: settings.contrasteEleve ? previewColors.text : '#E5E7EB',
        }}
      >
        <Text 
          className="text-sm mb-2" 
          style={{ 
            fontFamily: 'Nunito_600SemiBold', 
            color: settings.modeSombre ? '#9CA3AF' : '#6B7280' 
          }}
        >
          📱 Aperçu en direct
        </Text>
        <View 
          className="rounded-xl p-4"
          style={{ backgroundColor: previewColors.card }}
        >
          <Text
            style={{ 
              fontFamily: 'Nunito_700Bold',
              fontSize: fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16,
              color: previewColors.text,
              marginBottom: 8,
            }}
          >
            Exemple de courrier
          </Text>
          <Text
            style={{ 
              fontFamily: 'Nunito_400Regular',
              fontSize: (fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16) - 2,
              color: settings.modeSombre ? '#D1D5DB' : '#6B7280',
              lineHeight: (fontSizes.find(f => f.id === settings.taillePolice)?.sampleSize || 16) * 1.5,
            }}
          >
            Voici comment apparaîtra le texte avec vos réglages actuels.
          </Text>
        </View>
      </View>

      {/* Taille du texte */}
      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
          📝 Taille du texte
        </Text>
        <View className="space-y-3">
          {fontSizes.map((size) => (
            <Pressable
              key={size.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                settings.setTaillePolice(size.id);
              }}
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: settings.taillePolice === size.id ? '#DBEAFE' : '#F9FAFB',
                borderWidth: settings.taillePolice === size.id ? 2 : 0,
                borderColor: '#2563EB',
              }}
            >
              <View className="flex-row items-center">
                <Text
                  style={{ 
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: size.sampleSize,
                    color: settings.taillePolice === size.id ? '#1E40AF' : '#374151',
                  }}
                >
                  Aa
                </Text>
                <Text
                  className="ml-4"
                  style={{ 
                    fontFamily: 'Nunito_600SemiBold',
                    fontSize: 16,
                    color: settings.taillePolice === size.id ? '#1E40AF' : '#374151',
                  }}
                >
                  {size.label}
                </Text>
              </View>
              {settings.taillePolice === size.id && (
                <Check size={24} color="#2563EB" />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Mode sombre */}
      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
          🌓 Thème
        </Text>
        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (settings.modeSombre) settings.toggleModeSombre();
            }}
            className="flex-1 rounded-xl p-4 items-center"
            style={{
              backgroundColor: !settings.modeSombre ? '#FEF3C7' : '#F9FAFB',
              borderWidth: !settings.modeSombre ? 2 : 0,
              borderColor: '#F59E0B',
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>☀️</Text>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                color: !settings.modeSombre ? '#B45309' : '#6B7280',
              }}
            >
              Clair
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!settings.modeSombre) settings.toggleModeSombre();
            }}
            className="flex-1 rounded-xl p-4 items-center"
            style={{
              backgroundColor: settings.modeSombre ? '#312E81' : '#F9FAFB',
              borderWidth: settings.modeSombre ? 2 : 0,
              borderColor: '#4F46E5',
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🌙</Text>
            <Text
              style={{
                fontFamily: 'Nunito_600SemiBold',
                color: settings.modeSombre ? '#E0E7FF' : '#6B7280',
              }}
            >
              Sombre
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Contraste élevé */}
      <View className="bg-white rounded-2xl p-5">
        <ToggleRow
          label="🔆 Contraste élevé"
          description="Couleurs plus marquées pour mieux voir"
          value={settings.contrasteEleve}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            settings.toggleContrasteEleve();
          }}
        />
      </View>

      {/* Info */}
      <View 
        className="rounded-2xl p-4"
        style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}
      >
        <View className="flex-row items-start">
          <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
          <Text
            className="flex-1 text-sm"
            style={{ fontFamily: 'Nunito_400Regular', color: '#1E40AF', lineHeight: 20 }}
          >
            Les modifications sont appliquées immédiatement. Vous pouvez voir l'aperçu en haut de cette page.
          </Text>
        </View>
      </View>
    </View>
  );
}

// Section Son
function SonSection({ settings }: { settings: ReturnType<typeof useSettingsStore> }) {
  const voiceSpeeds: { id: VoiceSpeed; label: string }[] = [
    { id: 'lent', label: 'Lent' },
    { id: 'normal', label: 'Normal' },
    { id: 'rapide', label: 'Rapide' },
  ];

  return (
    <View className="space-y-5">
      {/* Volume */}
      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>
          Volume de la voix
        </Text>
        <Text className="text-base text-text-secondary mb-4" style={{ fontFamily: 'Nunito_400Regular' }}>
          {settings.volumeVocal}%
        </Text>
        <View className="flex-row items-center space-x-4">
          <Text style={{ fontSize: 20 }}>🔈</Text>
          <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full rounded-full"
              style={{ width: `${settings.volumeVocal}%`, backgroundColor: '#2563EB' }}
            />
          </View>
          <Text style={{ fontSize: 20 }}>🔊</Text>
        </View>
        <View className="flex-row justify-between mt-4">
          {[0, 25, 50, 75, 100].map((vol) => (
            <Pressable
              key={vol}
              onPress={() => settings.setVolumeVocal(vol)}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: settings.volumeVocal === vol ? '#DBEAFE' : '#F3F4F6' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: settings.volumeVocal === vol ? '#1E40AF' : '#6B7280' }}>
                {vol}%
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Vitesse */}
      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
          Vitesse de la voix
        </Text>
        <View className="flex-row space-x-3">
          {voiceSpeeds.map((speed) => (
            <Pressable
              key={speed.id}
              onPress={() => settings.setVitesseVocale(speed.id)}
              className="flex-1 py-4 rounded-xl items-center"
              style={{
                backgroundColor: settings.vitesseVocale === speed.id ? '#FEF3C7' : '#F9FAFB',
                borderWidth: settings.vitesseVocale === speed.id ? 2 : 0,
                borderColor: '#F59E0B',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: settings.vitesseVocale === speed.id ? '#B45309' : '#6B7280' }}>
                {speed.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Vibrations */}
      <View className="bg-white rounded-2xl p-5">
        <ToggleRow
          label="Vibrations"
          description="Retour haptique lors des interactions"
          value={settings.vibrationsActives}
          onToggle={settings.toggleVibrations}
        />
      </View>
    </View>
  );
}

// Section Notifications
function NotificationsSection({ settings }: { settings: ReturnType<typeof useSettingsStore> }) {
  const toggleRappelJour = (jour: number) => {
    const current = settings.rappelsJoursAvant;
    if (current.includes(jour)) {
      settings.setRappelsJours(current.filter((j) => j !== jour));
    } else {
      settings.setRappelsJours([...current, jour].sort((a, b) => a - b));
    }
  };

  return (
    <View className="space-y-5">
      <View className="bg-white rounded-2xl p-5 space-y-4">
        <ToggleRow
          label="Activer les notifications"
          description="Recevez des alertes pour vos courriers"
          value={settings.notificationsActives}
          onToggle={settings.toggleNotifications}
        />
        <ToggleRow
          label="Sons de notification"
          description="Jouer un son lors des alertes"
          value={settings.sonsNotification}
          onToggle={settings.toggleSonsNotification}
        />
      </View>

      <View className="bg-white rounded-2xl p-5">
        <Text className="text-lg text-text-primary mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
          Rappels avant date limite
        </Text>
        <View className="space-y-3">
          {[1, 3, 7].map((jour) => (
            <Pressable
              key={jour}
              onPress={() => toggleRappelJour(jour)}
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: settings.rappelsJoursAvant.includes(jour) ? '#D1FAE5' : '#F9FAFB',
              }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: '#374151' }}>
                {jour} jour{jour > 1 ? 's' : ''} avant
              </Text>
              {settings.rappelsJoursAvant.includes(jour) && (
                <Check size={24} color="#10B981" />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// Section Famille
function FamilleSection({ settings }: { settings: ReturnType<typeof useSettingsStore> }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAidant, setNewAidant] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    relation: 'Fils/Fille',
    notificationsUrgentes: true,
  });

  const handleAddAidant = () => {
    if (newAidant.prenom && newAidant.telephone) {
      settings.addAidant(newAidant);
      setNewAidant({
        prenom: '',
        nom: '',
        telephone: '',
        email: '',
        relation: 'Fils/Fille',
        notificationsUrgentes: true,
      });
      setShowAddForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveAidant = (id: string, prenom: string) => {
    Alert.alert(
      'Supprimer cet aidant ?',
      `${prenom} ne recevra plus de notifications.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => settings.removeAidant(id),
        },
      ]
    );
  };

  return (
    <View className="space-y-5">
      {/* Liste des aidants */}
      {settings.aidants.length > 0 && (
        <View className="bg-white rounded-2xl overflow-hidden">
          {settings.aidants.map((aidant, index) => (
            <View 
              key={aidant.id}
              className="p-5 flex-row items-center"
              style={{ borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#F3F4F6' }}
            >
              <View className="w-14 h-14 rounded-full bg-green-100 items-center justify-center">
                <Text style={{ fontSize: 28 }}>👤</Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-lg text-text-primary" style={{ fontFamily: 'Nunito_700Bold' }}>
                  {aidant.prenom} {aidant.nom}
                </Text>
                <Text className="text-sm text-text-secondary" style={{ fontFamily: 'Nunito_400Regular' }}>
                  {aidant.relation} • {aidant.telephone}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemoveAidant(aidant.id, aidant.prenom)}
                className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
              >
                <Trash2 size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {settings.aidants.length === 0 && !showAddForm && (
        <View className="bg-white rounded-2xl p-8 items-center">
          <Text style={{ fontSize: 48, marginBottom: 16 }}>👨‍👩‍👧</Text>
          <Text className="text-xl text-text-primary text-center mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>
            Aucun aidant ajouté
          </Text>
          <Text className="text-base text-text-secondary text-center" style={{ fontFamily: 'Nunito_400Regular' }}>
            Ajoutez un proche pour qu'il reçoive des alertes en cas de courrier urgent
          </Text>
        </View>
      )}

      {/* Add form */}
      {showAddForm && (
        <View className="bg-white rounded-2xl p-5 space-y-4">
          <Text className="text-lg text-text-primary" style={{ fontFamily: 'Nunito_700Bold' }}>
            Nouvel aidant
          </Text>
          <InputField 
            label="Prénom" 
            value={newAidant.prenom} 
            onChangeText={(v) => setNewAidant({ ...newAidant, prenom: v })} 
            placeholder="Prénom" 
          />
          <InputField 
            label="Téléphone" 
            value={newAidant.telephone} 
            onChangeText={(v) => setNewAidant({ ...newAidant, telephone: v })} 
            placeholder="06 12 34 56 78" 
            keyboardType="phone-pad"
          />
          <InputField 
            label="Email (optionnel)" 
            value={newAidant.email} 
            onChangeText={(v) => setNewAidant({ ...newAidant, email: v })} 
            placeholder="email@exemple.com" 
            keyboardType="email-address"
          />
          
          <View className="flex-row space-x-3 pt-2">
            <Pressable
              onPress={() => setShowAddForm(false)}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleAddAidant}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: 'white' }}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Add button */}
      {!showAddForm && (
        <Pressable
          onPress={() => setShowAddForm(true)}
          className="bg-white rounded-2xl p-5 flex-row items-center justify-center active:scale-[0.98]"
          style={{ borderWidth: 2, borderColor: '#10B981', borderStyle: 'dashed' }}
        >
          <Plus size={24} color="#10B981" />
          <Text className="text-lg ml-3" style={{ fontFamily: 'Nunito_700Bold', color: '#10B981' }}>
            Ajouter un aidant
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Section À propos
function AProposSection() {
  const router = useRouter();
  const settings = useSettingsStore();

  const handleResetOnboarding = () => {
    Alert.alert(
      'Revoir le tutoriel ?',
      "L'application va redémarrer au début.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            // Reset onboarding flag
            await AsyncStorage.removeItem('monadmin_settings');
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <View className="space-y-5">
      <View className="bg-white rounded-2xl p-6 items-center">
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📱</Text>
        <Text className="text-2xl text-text-primary" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
          MonAdmin
        </Text>
        <Text className="text-base text-text-secondary mt-1" style={{ fontFamily: 'Nunito_400Regular' }}>
          Version 2.0.0
        </Text>
        <Text className="text-base text-text-secondary text-center mt-4 px-4" style={{ fontFamily: 'Nunito_400Regular' }}>
          Votre assistant administratif intelligent pour simplifier vos courriers au quotidien.
        </Text>
      </View>

      <View className="bg-white rounded-2xl overflow-hidden">
        {[
          { label: 'Politique de confidentialité', icon: '🔒' },
          { label: "Conditions d'utilisation", icon: '📄' },
          { label: 'Nous contacter', icon: '✉️' },
        ].map((item, index) => (
          <Pressable
            key={item.label}
            className="p-5 flex-row items-center active:bg-gray-50"
            style={{ borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#F3F4F6' }}
          >
            <Text style={{ fontSize: 24, marginRight: 16 }}>{item.icon}</Text>
            <Text className="flex-1 text-lg text-text-primary" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              {item.label}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>

      {/* Revoir le tutoriel */}
      <Pressable
        onPress={handleResetOnboarding}
        className="bg-white rounded-2xl p-5 flex-row items-center active:bg-gray-50"
      >
        <Text style={{ fontSize: 24, marginRight: 16 }}>🎓</Text>
        <Text className="flex-1 text-lg text-text-primary" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          Revoir le tutoriel
        </Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </Pressable>

      <View className="items-center py-4">
        <Text className="text-sm text-text-secondary" style={{ fontFamily: 'Nunito_400Regular' }}>
          Fait avec ❤️ pour les seniors
        </Text>
      </View>
    </View>
  );
}

// Composants utilitaires
function InputField({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="text-sm text-text-secondary mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        className="bg-gray-50 rounded-xl px-4 py-4 text-lg text-text-primary"
        style={{ 
          fontFamily: 'Nunito_400Regular',
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function ToggleRow({ 
  label, 
  description, 
  value, 
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 mr-4">
        <Text className="text-lg text-text-primary" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          {label}
        </Text>
        <Text className="text-sm text-text-secondary" style={{ fontFamily: 'Nunito_400Regular' }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
        thumbColor={value ? '#2563EB' : '#9CA3AF'}
      />
    </View>
  );
}
