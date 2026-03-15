import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SettingsStore } from '@/lib/state/settings-store';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { useTranslation } from '@/lib/i18n';
import { InputField } from './shared';

export function ProfilSection({ settings }: { settings: SettingsStore }) {
  const t = useTranslation();
  const display = useDisplaySettings();
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
      <View
        className="rounded-2xl p-5"
        style={{ backgroundColor: display.colors.card }}
      >
        <Text
          className="mb-4"
          style={{
            fontFamily: 'Nunito_700Bold',
            fontSize: display.fontSize.lg,
            color: display.colors.text,
          }}
        >
          {t('settings.avatar')}
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
      <View
        className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: display.colors.card }}
      >
        <InputField label={t('settings.firstname')} value={prenom} onChangeText={setPrenom} placeholder={t('settings.firstname_ph')} />
        <InputField label={t('settings.lastname')} value={nom} onChangeText={setNom} placeholder={t('settings.lastname_ph')} />
        <InputField label={t('settings.phone')} value={telephone} onChangeText={setTelephone} placeholder={t('settings.phone_ph')} keyboardType="phone-pad" />
        <InputField label={t('settings.address')} value={adresse} onChangeText={setAdresse} placeholder={t('settings.address_ph')} multiline />
      </View>

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        className="bg-primary rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
        style={{ backgroundColor: '#2563EB' }}
      >
        <Check size={24} color="white" />
        <Text className="text-xl text-white ml-3" style={{ fontFamily: 'Nunito_700Bold' }}>
          {t('settings.save')}
        </Text>
      </Pressable>
    </View>
  );
}
