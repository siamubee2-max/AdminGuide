import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Check, 
  Users, 
  Share2, 
  UserPlus,
  Send,
  CheckCircle2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { 
  useFamilyStore, 
  FamilyMember,
  ROLE_CONFIG,
  formatMemberName,
} from '@/lib/state/family-store';
import { useHistoryStore } from '@/lib/state/history-store';
import { Document } from '@/lib/types';

interface ShareDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  document: Document;
}

export function ShareDocumentModal({ visible, onClose, document }: ShareDocumentModalProps) {
  const router = useRouter();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareComplete, setShareComplete] = useState(false);

  const members = useFamilyStore((s) => s.members);
  const shareDocument = useFamilyStore((s) => s.shareDocument);
  const getDocumentShares = useFamilyStore((s) => s.getDocumentShares);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  
  const addAction = useHistoryStore((s) => s.addAction);

  useEffect(() => {
    if (visible) {
      loadFamily();
      setShareComplete(false);
      
      // Pre-select already shared members
      const existingShares = getDocumentShares(document.id);
      if (existingShares) {
        setSelectedMembers(existingShares.sharedWith);
      } else {
        setSelectedMembers([]);
      }
    }
  }, [visible, document.id]);

  const toggleMember = (memberId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleShare = async () => {
    if (selectedMembers.length === 0) return;

    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await shareDocument(document.id, selectedMembers, message || undefined);
      
      // Track in history
      const memberNames = selectedMembers
        .map((id) => members.find((m) => m.id === id))
        .filter(Boolean)
        .map((m) => m!.prenom)
        .join(', ');
      
      addAction({
        type: 'shared',
        title: 'Document partagé',
        description: `Partagé avec ${memberNames}`,
        documentId: String(document.id),
        documentTitle: document.titre,
      });

      setShareComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Close after delay
      setTimeout(() => {
        onClose();
        setShareComplete(false);
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error sharing document:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGoToFamily = () => {
    onClose();
    router.push('/famille');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
            <View className="flex-row items-center">
              <Share2 size={24} color="#10B981" />
              <Text
                className="text-2xl text-text-primary ml-3"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Partager
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={24} color="#6B7280" />
            </Pressable>
          </View>

          {shareComplete ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              className="flex-1 items-center justify-center px-8"
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <CheckCircle2 size={56} color="#10B981" />
              </View>
              <Text
                className="text-2xl text-text-primary text-center mb-2"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                Partagé ! 🎉
              </Text>
              <Text
                className="text-base text-text-secondary text-center"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {selectedMembers.length} membre{selectedMembers.length > 1 ? 's' : ''} peuvent maintenant voir ce document
              </Text>
            </Animated.View>
          ) : (
            <>
              <ScrollView className="flex-1 px-6 py-4">
                {/* Document preview */}
                <Animated.View
                  entering={FadeInUp.duration(400)}
                  className="rounded-2xl p-4 mb-6"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <Text
                    className="text-sm text-text-secondary mb-1"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    Document à partager
                  </Text>
                  <Text
                    className="text-lg text-text-primary"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {document.titre}
                  </Text>
                  <Text
                    className="text-sm text-text-secondary mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {document.type} • {document.organisme}
                  </Text>
                </Animated.View>

                {/* Members selection */}
                {members.length === 0 ? (
                  <Animated.View
                    entering={FadeIn.duration(400)}
                    className="items-center py-8"
                  >
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center mb-4"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <Users size={40} color="#9CA3AF" />
                    </View>
                    <Text
                      className="text-lg text-text-primary text-center mb-2"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Pas encore de famille
                    </Text>
                    <Text
                      className="text-base text-text-secondary text-center mb-6"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      Ajoutez des membres pour partager vos documents
                    </Text>
                    <Pressable
                      onPress={handleGoToFamily}
                      className="rounded-xl px-6 py-3 flex-row items-center active:scale-95"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <UserPlus size={20} color="white" />
                      <Text
                        className="text-base text-white ml-2"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        Ajouter des membres
                      </Text>
                    </Pressable>
                  </Animated.View>
                ) : (
                  <>
                    <Text
                      className="text-base text-text-primary mb-3"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Partager avec
                    </Text>
                    
                    {members.map((member, index) => {
                      const isSelected = selectedMembers.includes(member.id);
                      const roleConfig = ROLE_CONFIG[member.role];
                      
                      return (
                        <Animated.View
                          key={member.id}
                          entering={FadeInUp.duration(300).delay(index * 50)}
                        >
                          <Pressable
                            onPress={() => toggleMember(member.id)}
                            className="flex-row items-center p-4 rounded-xl mb-2 active:scale-[0.98]"
                            style={{
                              backgroundColor: isSelected ? '#ECFDF5' : '#F9FAFB',
                              borderWidth: isSelected ? 2 : 1,
                              borderColor: isSelected ? '#10B981' : '#E5E7EB',
                            }}
                          >
                            <View
                              className="w-14 h-14 rounded-xl items-center justify-center"
                              style={{ backgroundColor: isSelected ? '#D1FAE5' : '#F3F4F6' }}
                            >
                              <Text style={{ fontSize: 28 }}>{member.avatar}</Text>
                            </View>
                            <View className="flex-1 ml-3">
                              <Text
                                className="text-base"
                                style={{ 
                                  fontFamily: 'Nunito_700Bold',
                                  color: isSelected ? '#047857' : '#374151',
                                }}
                              >
                                {formatMemberName(member)}
                              </Text>
                              <Text
                                className="text-sm"
                                style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
                              >
                                {roleConfig.icon} {roleConfig.label}
                              </Text>
                            </View>
                            <View
                              className="w-7 h-7 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: isSelected ? '#10B981' : '#E5E7EB',
                              }}
                            >
                              {isSelected && <Check size={16} color="white" />}
                            </View>
                          </Pressable>
                        </Animated.View>
                      );
                    })}

                    {/* Message input */}
                    <View className="mt-4">
                      <Text
                        className="text-base text-text-primary mb-2"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Message (optionnel)
                      </Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Ex: Peux-tu m'aider avec ce courrier ?"
                        multiline
                        numberOfLines={3}
                        className="bg-white rounded-xl px-4 py-3"
                        style={{
                          fontFamily: 'Nunito_400Regular',
                          fontSize: 16,
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          textAlignVertical: 'top',
                          minHeight: 80,
                        }}
                      />
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Share button */}
              {members.length > 0 && (
                <View className="px-6 py-4 border-t border-gray-200">
                  <Pressable
                    onPress={handleShare}
                    disabled={selectedMembers.length === 0 || isSharing}
                    className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98]"
                    style={{
                      backgroundColor: selectedMembers.length > 0 ? '#10B981' : '#E5E7EB',
                    }}
                  >
                    <Send
                      size={22}
                      color={selectedMembers.length > 0 ? 'white' : '#9CA3AF'}
                    />
                    <Text
                      className="text-lg ml-2"
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        color: selectedMembers.length > 0 ? 'white' : '#9CA3AF',
                      }}
                    >
                      {isSharing
                        ? 'Partage en cours...'
                        : `Partager avec ${selectedMembers.length} membre${selectedMembers.length > 1 ? 's' : ''}`}
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
