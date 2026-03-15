import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Trash2, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SettingsStore } from '@/lib/state/settings-store';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { useTranslation } from '@/lib/i18n';
import { InputField } from './shared';

export function FamilleSection({ settings }: { settings: SettingsStore }) {
  const t = useTranslation();
  const display = useDisplaySettings();
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
      t('settings.delete_helper'),
      t('settings.delete_helper_msg', { name: prenom }),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
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
        <View
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: display.colors.card }}
        >
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
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: display.fontSize.lg,
                    color: display.colors.text,
                  }}
                >
                  {aidant.prenom} {aidant.nom}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Nunito_400Regular',
                    fontSize: display.fontSize.sm,
                    color: display.colors.textMuted,
                  }}
                >
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
        <View
          className="rounded-2xl p-8 items-center"
          style={{ backgroundColor: display.colors.card }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>👨‍👩‍👧</Text>
          <Text
            className="text-center mb-2"
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: display.fontSize.xl,
              color: display.colors.text,
            }}
          >
            {t('settings.no_helpers')}
          </Text>
          <Text
            className="text-center"
            style={{
              fontFamily: 'Nunito_400Regular',
              fontSize: display.fontSize.base,
              color: display.colors.textMuted,
            }}
          >
            {t('settings.helpers_desc')}
          </Text>
        </View>
      )}

      {/* Add form */}
      {showAddForm && (
        <View
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: display.colors.card }}
        >
          <Text
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: display.fontSize.lg,
              color: display.colors.text,
            }}
          >
            {t('settings.new_helper')}
          </Text>
          <InputField
            label={t('settings.firstname')}
            value={newAidant.prenom}
            onChangeText={(v) => setNewAidant({ ...newAidant, prenom: v })}
            placeholder={t('settings.firstname_ph')}
          />
          <InputField
            label={t('settings.phone')}
            value={newAidant.telephone}
            onChangeText={(v) => setNewAidant({ ...newAidant, telephone: v })}
            placeholder={t('settings.phone_ph')}
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
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: '#6B7280' }}>
                {t('settings.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAddAidant}
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text style={{ fontFamily: 'Nunito_600SemiBold', color: 'white' }}>
                {t('settings.add')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Add button */}
      {!showAddForm && (
        <Pressable
          onPress={() => setShowAddForm(true)}
          className="rounded-2xl p-5 flex-row items-center justify-center active:scale-[0.98]"
          style={{
            backgroundColor: display.colors.card,
            borderWidth: 2,
            borderColor: '#10B981',
            borderStyle: 'dashed',
          }}
        >
          <Plus size={24} color="#10B981" />
          <Text className="text-lg ml-3" style={{ fontFamily: 'Nunito_700Bold', color: '#10B981' }}>
            {t('settings.add_helper')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
