import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Copy, Check, ChevronRight, PenLine, Send } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Document } from '@/lib/types';
import { ResponseTemplate, generateResponseTemplates } from '@/lib/services/ai-service';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { useSettingsStore } from '@/lib/state/settings-store';
import { useTranslation } from '@/lib/i18n';

interface ResponseTemplatesProps {
  document: Document;
  onSelectTemplate?: (template: ResponseTemplate) => void;
}

export function ResponseTemplates({ document, onSelectTemplate }: ResponseTemplatesProps) {
  const t = useTranslation();
  const display = useDisplaySettings();
  const profile = useSettingsStore((s) => s.profile);
  const language = useSettingsStore((s) => s.language);

  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const templates = generateResponseTemplates(
    document,
    { prenom: profile.prenom, nom: profile.nom, adresse: profile.adresse },
    language
  );

  const handleSelectTemplate = (template: ResponseTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(template);
    setShowPreview(true);
    onSelectTemplate?.(template);
  };

  const handleCopy = async () => {
    if (selectedTemplate) {
      const fullText = `Objet : ${selectedTemplate.subject}\n\n${selectedTemplate.body}`;
      await Clipboard.setStringAsync(fullText);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTemplateColors = (type: ResponseTemplate['type']) => {
    const colors: Record<ResponseTemplate['type'], { bg: string; border: string; text: string; icon: string }> = {
      accept: { bg: '#D1FAE5', border: '#10B981', text: '#047857', icon: '#059669' },
      refuse: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', icon: '#DC2626' },
      info_request: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF', icon: '#2563EB' },
      confirm: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8', icon: '#7C3AED' },
      delay: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: '#D97706' },
      complaint: { bg: '#FFE4E6', border: '#F43F5E', text: '#9F1239', icon: '#E11D48' },
    };
    return colors[type] || colors.confirm;
  };

  return (
    <View>
      {/* Templates Grid */}
      <View className="mb-4">
        <View className="flex-row items-center mb-4">
          <PenLine size={22} color={display.colors.primary} />
          <Text
            className="ml-2"
            style={{
              fontFamily: 'Nunito_700Bold',
              fontSize: display.fontSize.lg,
              color: display.colors.text,
            }}
          >
            {language === 'fr' ? 'Modeles de reponse' : language === 'es' ? 'Plantillas de respuesta' : 'Response Templates'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
          style={{ flexGrow: 0 }}
        >
          {templates.map((template, index) => {
            const colors = getTemplateColors(template.type);
            return (
              <Animated.View
                key={template.id}
                entering={FadeInUp.duration(300).delay(index * 50)}
              >
                <Pressable
                  onPress={() => handleSelectTemplate(template)}
                  className="mr-3 rounded-2xl p-4 active:scale-[0.97]"
                  style={{
                    backgroundColor: colors.bg,
                    borderWidth: 2,
                    borderColor: colors.border,
                    minWidth: 140,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${colors.border}20` }}
                  >
                    <Text style={{ fontSize: 24 }}>{template.icon}</Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: display.fontSize.base,
                      color: colors.text,
                    }}
                  >
                    {template.label}
                  </Text>
                  <Text
                    className="mt-1"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.xs,
                      color: colors.text,
                      opacity: 0.8,
                    }}
                    numberOfLines={2}
                  >
                    {template.description}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: display.colors.background }}>
          {selectedTemplate && (
            <View className="flex-1">
              {/* Header */}
              <View
                className="px-6 py-4 flex-row items-center justify-between"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: display.colors.border,
                }}
              >
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{selectedTemplate.icon}</Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_800ExtraBold',
                      fontSize: display.fontSize.xl,
                      color: display.colors.text,
                    }}
                  >
                    {selectedTemplate.label}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowPreview(false)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: display.colors.backgroundSecondary }}
                >
                  <X size={24} color={display.colors.textMuted} />
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView
                className="flex-1 px-6 py-4"
                showsVerticalScrollIndicator={false}
              >
                {/* Subject */}
                <View
                  className="rounded-2xl p-5 mb-4"
                  style={{ backgroundColor: display.colors.card }}
                >
                  <Text
                    className="mb-2"
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      fontSize: display.fontSize.sm,
                      color: display.colors.textMuted,
                    }}
                  >
                    {language === 'fr' ? 'OBJET' : language === 'es' ? 'ASUNTO' : 'SUBJECT'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: display.fontSize.lg,
                      color: display.colors.text,
                    }}
                  >
                    {selectedTemplate.subject}
                  </Text>
                </View>

                {/* Body */}
                <View
                  className="rounded-2xl p-5 mb-4"
                  style={{ backgroundColor: display.colors.card }}
                >
                  <Text
                    className="mb-2"
                    style={{
                      fontFamily: 'Nunito_600SemiBold',
                      fontSize: display.fontSize.sm,
                      color: display.colors.textMuted,
                    }}
                  >
                    {language === 'fr' ? 'CONTENU' : language === 'es' ? 'CONTENIDO' : 'CONTENT'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.base,
                      color: display.colors.text,
                      lineHeight: display.fontSize.base * 1.6,
                    }}
                  >
                    {selectedTemplate.body}
                  </Text>
                </View>

                {/* Tip */}
                <View
                  className="rounded-2xl p-4 flex-row items-start"
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>💡</Text>
                  <Text
                    className="flex-1"
                    style={{
                      fontFamily: 'Nunito_400Regular',
                      fontSize: display.fontSize.sm,
                      color: '#1E40AF',
                      lineHeight: display.fontSize.sm * 1.5,
                    }}
                  >
                    {language === 'fr'
                      ? 'Personnalisez les parties entre crochets [...] avant d\'envoyer votre courrier.'
                      : language === 'es'
                      ? 'Personalice las partes entre corchetes [...] antes de enviar su carta.'
                      : 'Customize the parts in brackets [...] before sending your letter.'}
                  </Text>
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View
                className="px-6 py-4"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: display.colors.border,
                }}
              >
                <Pressable
                  onPress={handleCopy}
                  className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98]"
                  style={{ backgroundColor: copied ? '#10B981' : '#2563EB' }}
                >
                  {copied ? (
                    <>
                      <Check size={22} color="white" />
                      <Text
                        className="ml-3"
                        style={{
                          fontFamily: 'Nunito_700Bold',
                          fontSize: display.fontSize.lg,
                          color: 'white',
                        }}
                      >
                        {language === 'fr' ? 'Copie !' : language === 'es' ? 'Copiado!' : 'Copied!'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={22} color="white" />
                      <Text
                        className="ml-3"
                        style={{
                          fontFamily: 'Nunito_700Bold',
                          fontSize: display.fontSize.lg,
                          color: 'white',
                        }}
                      >
                        {language === 'fr' ? 'Copier la reponse' : language === 'es' ? 'Copiar respuesta' : 'Copy response'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
