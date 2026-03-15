import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';

export function InputField({
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
  const display = useDisplaySettings();

  return (
    <View>
      <Text
        className="mb-2"
        style={{
          fontFamily: 'Nunito_600SemiBold',
          fontSize: display.fontSize.sm,
          color: display.colors.textMuted,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        className="rounded-xl px-4 py-4"
        style={{
          fontFamily: 'Nunito_400Regular',
          fontSize: display.fontSize.lg,
          color: display.colors.text,
          backgroundColor: display.isDarkMode ? '#1F2937' : '#F9FAFB',
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export function ToggleRow({
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
  const display = useDisplaySettings();

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 mr-4">
        <Text
          style={{
            fontFamily: 'Nunito_600SemiBold',
            fontSize: display.fontSize.lg,
            color: display.colors.text,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: 'Nunito_400Regular',
            fontSize: display.fontSize.sm,
            color: display.colors.textMuted,
          }}
        >
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
