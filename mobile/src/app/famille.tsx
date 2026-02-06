import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  Users,
  Phone,
  Mail,
  X,
  Check,
  Trash2,
  Share2,
  Copy,
  Bell,
  BellOff,
  Edit3,
  Link,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  useFamilyStore,
  FamilyMember,
  FamilyRole,
  FAMILY_AVATARS,
  ROLE_CONFIG,
  formatMemberName,
} from '@/lib/state/family-store';
import { useHistoryStore } from '@/lib/state/history-store';
import { useTranslation } from '@/lib/i18n';

export default function FamilleScreen() {
  const router = useRouter();
  const t = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // Form state
  const [formPrenom, setFormPrenom] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatar, setFormAvatar] = useState('👨');
  const [formRole, setFormRole] = useState<FamilyRole>('helper');
  const [formNotifications, setFormNotifications] = useState(true);

  const members = useFamilyStore((s) => s.members);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const addMember = useFamilyStore((s) => s.addMember);
  const updateMember = useFamilyStore((s) => s.updateMember);
  const removeMember = useFamilyStore((s) => s.removeMember);
  const generateInviteCode = useFamilyStore((s) => s.generateInviteCode);
  const sharedDocuments = useFamilyStore((s) => s.sharedDocuments);

  const addAction = useHistoryStore((s) => s.addAction);

  useEffect(() => {
    loadFamily();
  }, []);

  const resetForm = () => {
    setFormPrenom('');
    setFormNom('');
    setFormTelephone('');
    setFormEmail('');
    setFormAvatar('👨');
    setFormRole('helper');
    setFormNotifications(true);
    setEditingMember(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setFormPrenom(member.prenom);
    setFormNom(member.nom || '');
    setFormTelephone(member.telephone || '');
    setFormEmail(member.email || '');
    setFormAvatar(member.avatar);
    setFormRole(member.role);
    setFormNotifications(member.notificationsActives);
    setEditingMember(member);
    setShowAddModal(true);
  };

  const handleSaveMember = async () => {
    if (!formPrenom.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingMember) {
      await updateMember(editingMember.id, {
        prenom: formPrenom.trim(),
        nom: formNom.trim() || undefined,
        telephone: formTelephone.trim() || undefined,
        email: formEmail.trim() || undefined,
        avatar: formAvatar,
        role: formRole,
        notificationsActives: formNotifications,
      });
    } else {
      await addMember({
        prenom: formPrenom.trim(),
        nom: formNom.trim() || undefined,
        telephone: formTelephone.trim() || undefined,
        email: formEmail.trim() || undefined,
        avatar: formAvatar,
        role: formRole,
        notificationsActives: formNotifications,
      });
      
      // Track in history
      addAction({
        type: 'shared',
        title: `Membre ajouté : ${formPrenom}`,
        description: `Rôle : ${ROLE_CONFIG[formRole].label}`,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    resetForm();
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      t('family.delete_confirm'),
      `${formatMemberName(member)} n'aura plus accès aux documents partagés.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await removeMember(member.id);
          },
        },
      ]
    );
  };

  const handleGenerateInvite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const code = await generateInviteCode(formRole);
    setGeneratedCode(code);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Rejoignez ma famille sur MonAdmin ! 👨‍👩‍👧‍👦\n\nCode d'invitation : ${generatedCode}\n\nCe code est valable 7 jours.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getMemberSharedCount = (memberId: string) => {
    return sharedDocuments.filter((s) => s.sharedWith.includes(memberId)).length;
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-6"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-4 active:opacity-70"
          >
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <ChevronLeft size={24} color="white" />
            </View>
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {t('common.back')}
            </Text>
          </Pressable>
          
          <View className="flex-row items-center">
            <Text style={{ fontSize: 36 }}>👨‍👩‍👧‍👦</Text>
            <View className="ml-4">
              <Text
                className="text-3xl text-white"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {t('family.title')}
              </Text>
              <Text
                className="text-base text-white/80 mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {t('family.count', { count: members.length, s: members.length > 1 ? 's' : '' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 bg-background rounded-t-3xl"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Action buttons */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="flex-row space-x-3 mb-6"
          >
            <Pressable
              onPress={handleOpenAddModal}
              className="flex-1 rounded-2xl p-4 flex-row items-center justify-center active:scale-95"
              style={{ backgroundColor: '#10B981' }}
            >
              <UserPlus size={22} color="white" />
              <Text
                className="text-white text-base ml-2"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {t('family.add')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setFormRole('helper');
                setGeneratedCode('');
                setShowInviteModal(true);
              }}
              className="flex-1 rounded-2xl p-4 flex-row items-center justify-center active:scale-95"
              style={{ backgroundColor: '#2563EB' }}
            >
              <Link size={22} color="white" />
              <Text
                className="text-white text-base ml-2"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {t('family.invite')}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Info card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: '#ECFDF5', borderWidth: 2, borderColor: '#A7F3D0' }}
          >
            <View className="flex-row items-start">
              <Text style={{ fontSize: 24, marginRight: 12 }}>💡</Text>
              <View className="flex-1">
                <Text
                  className="text-base mb-1"
                  style={{ fontFamily: 'Nunito_700Bold', color: '#047857' }}
                >
                  {t('family.info_title')}
                </Text>
                <Text
                  className="text-sm leading-5"
                  style={{ fontFamily: 'Nunito_400Regular', color: '#065F46' }}
                >
                  {t('family.info_msg')}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Members list */}
          {members.length === 0 ? (
            <Animated.View
              entering={FadeIn.duration(500)}
              className="items-center py-12"
            >
              <View 
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Users size={48} color="#9CA3AF" />
              </View>
              <Text
                className="text-xl text-text-primary text-center mb-2"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Pas encore de membres
              </Text>
              <Text
                className="text-base text-text-secondary text-center px-8"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Ajoutez des membres de votre famille pour partager vos courriers avec eux
              </Text>
            </Animated.View>
          ) : (
            <View>
              <Text
                className="text-lg text-text-primary mb-4"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Membres de la famille
              </Text>
              
              {members.map((member, index) => {
                const roleConfig = ROLE_CONFIG[member.role];
                const sharedCount = getMemberSharedCount(member.id);
                
                return (
                  <Animated.View
                    key={member.id}
                    entering={SlideInRight.duration(400).delay(index * 100)}
                  >
                    <Pressable
                      onPress={() => handleEditMember(member)}
                      className="rounded-2xl p-4 mb-3 active:scale-[0.98]"
                      style={{ 
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-center">
                        {/* Avatar */}
                        <View
                          className="w-16 h-16 rounded-2xl items-center justify-center"
                          style={{ backgroundColor: `${roleConfig.color}15` }}
                        >
                          <Text style={{ fontSize: 32 }}>{member.avatar}</Text>
                        </View>
                        
                        {/* Info */}
                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center">
                            <Text
                              className="text-lg text-text-primary"
                              style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                              {formatMemberName(member)}
                            </Text>
                            <View 
                              className="ml-2 px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${roleConfig.color}20` }}
                            >
                              <Text
                                className="text-xs"
                                style={{ fontFamily: 'Nunito_600SemiBold', color: roleConfig.color }}
                              >
                                {roleConfig.icon} {roleConfig.label}
                              </Text>
                            </View>
                          </View>
                          
                          {(member.telephone || member.email) && (
                            <View className="flex-row items-center mt-1">
                              {member.telephone && (
                                <View className="flex-row items-center mr-4">
                                  <Phone size={12} color="#6B7280" />
                                  <Text
                                    className="text-sm text-text-secondary ml-1"
                                    style={{ fontFamily: 'Nunito_400Regular' }}
                                  >
                                    {member.telephone}
                                  </Text>
                                </View>
                              )}
                              {member.email && (
                                <View className="flex-row items-center">
                                  <Mail size={12} color="#6B7280" />
                                  <Text
                                    className="text-sm text-text-secondary ml-1"
                                    style={{ fontFamily: 'Nunito_400Regular' }}
                                    numberOfLines={1}
                                  >
                                    {member.email}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                          
                          <View className="flex-row items-center mt-2">
                            <View className="flex-row items-center">
                              <Share2 size={12} color="#10B981" />
                              <Text
                                className="text-xs ml-1"
                                style={{ fontFamily: 'Nunito_600SemiBold', color: '#10B981' }}
                              >
                                {sharedCount} document{sharedCount > 1 ? 's' : ''} partagé{sharedCount > 1 ? 's' : ''}
                              </Text>
                            </View>
                            {member.notificationsActives ? (
                              <View className="flex-row items-center ml-4">
                                <Bell size={12} color="#F59E0B" />
                                <Text
                                  className="text-xs ml-1"
                                  style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
                                >
                                  Notifications ON
                                </Text>
                              </View>
                            ) : (
                              <View className="flex-row items-center ml-4">
                                <BellOff size={12} color="#9CA3AF" />
                                <Text
                                  className="text-xs ml-1"
                                  style={{ fontFamily: 'Nunito_400Regular', color: '#9CA3AF' }}
                                >
                                  Notifications OFF
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        {/* Actions */}
                        <View className="flex-row items-center">
                          <Pressable
                            onPress={() => handleRemoveMember(member)}
                            className="w-10 h-10 rounded-full items-center justify-center active:bg-red-50"
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </Pressable>
                          <ChevronRight size={20} color="#9CA3AF" />
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add/Edit Member Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
              <Text
                className="text-2xl text-text-primary"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {editingMember ? '✏️ Modifier' : '➕ Ajouter un membre'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {/* Avatar selection */}
              <View className="mb-6">
                <Text
                  className="text-base text-text-primary mb-3"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Avatar
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {FAMILY_AVATARS.map((avatar) => (
                    <Pressable
                      key={avatar}
                      onPress={() => setFormAvatar(avatar)}
                      className="w-16 h-16 rounded-2xl items-center justify-center active:scale-95"
                      style={{
                        backgroundColor: formAvatar === avatar ? '#10B981' : '#F3F4F6',
                        borderWidth: formAvatar === avatar ? 3 : 0,
                        borderColor: '#059669',
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{avatar}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Name fields */}
              <View className="mb-4">
                <Text
                  className="text-base text-text-primary mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Prénom *
                </Text>
                <TextInput
                  value={formPrenom}
                  onChangeText={setFormPrenom}
                  placeholder="Ex: Marie"
                  className="bg-white rounded-xl px-4 py-4 text-lg"
                  style={{ 
                    fontFamily: 'Nunito_400Regular',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              <View className="mb-4">
                <Text
                  className="text-base text-text-primary mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Nom (optionnel)
                </Text>
                <TextInput
                  value={formNom}
                  onChangeText={setFormNom}
                  placeholder="Ex: Dupont"
                  className="bg-white rounded-xl px-4 py-4 text-lg"
                  style={{ 
                    fontFamily: 'Nunito_400Regular',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              {/* Contact fields */}
              <View className="mb-4">
                <Text
                  className="text-base text-text-primary mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Téléphone (optionnel)
                </Text>
                <TextInput
                  value={formTelephone}
                  onChangeText={setFormTelephone}
                  placeholder="Ex: 06 12 34 56 78"
                  keyboardType="phone-pad"
                  className="bg-white rounded-xl px-4 py-4 text-lg"
                  style={{ 
                    fontFamily: 'Nunito_400Regular',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              <View className="mb-6">
                <Text
                  className="text-base text-text-primary mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Email (optionnel)
                </Text>
                <TextInput
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="Ex: marie@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-white rounded-xl px-4 py-4 text-lg"
                  style={{ 
                    fontFamily: 'Nunito_400Regular',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>

              {/* Role selection */}
              <View className="mb-6">
                <Text
                  className="text-base text-text-primary mb-3"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Rôle
                </Text>
                {(['helper', 'viewer'] as FamilyRole[]).map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setFormRole(role)}
                      className="p-4 rounded-xl mb-2"
                      style={{
                        backgroundColor: formRole === role ? `${config.color}10` : '#F9FAFB',
                        borderWidth: formRole === role ? 2 : 1,
                        borderColor: formRole === role ? config.color : '#E5E7EB',
                      }}
                    >
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{config.icon}</Text>
                        <View className="flex-1">
                          <Text
                            className="text-base"
                            style={{ 
                              fontFamily: 'Nunito_700Bold', 
                              color: formRole === role ? config.color : '#374151' 
                            }}
                          >
                            {config.label}
                          </Text>
                          <Text
                            className="text-sm"
                            style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
                          >
                            {config.description}
                          </Text>
                        </View>
                        {formRole === role && (
                          <Check size={24} color={config.color} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Notifications toggle */}
              <Pressable
                onPress={() => setFormNotifications(!formNotifications)}
                className="flex-row items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}
              >
                <View className="flex-row items-center">
                  {formNotifications ? (
                    <Bell size={24} color="#F59E0B" />
                  ) : (
                    <BellOff size={24} color="#9CA3AF" />
                  )}
                  <View className="ml-3">
                    <Text
                      className="text-base text-text-primary"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      Notifications
                    </Text>
                    <Text
                      className="text-sm text-text-secondary"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      Recevoir des alertes pour les courriers urgents
                    </Text>
                  </View>
                </View>
                <View
                  className="w-12 h-7 rounded-full justify-center"
                  style={{ 
                    backgroundColor: formNotifications ? '#10B981' : '#D1D5DB',
                    paddingHorizontal: 3,
                  }}
                >
                  <View
                    className="w-5 h-5 rounded-full bg-white"
                    style={{
                      alignSelf: formNotifications ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </Pressable>
            </ScrollView>

            {/* Save button */}
            <View className="px-6 py-4 border-t border-gray-200">
              <Pressable
                onPress={handleSaveMember}
                disabled={!formPrenom.trim()}
                className="rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98]"
                style={{ backgroundColor: formPrenom.trim() ? '#10B981' : '#E5E7EB' }}
              >
                <Check size={24} color={formPrenom.trim() ? 'white' : '#9CA3AF'} />
                <Text
                  className="text-lg ml-2"
                  style={{ 
                    fontFamily: 'Nunito_700Bold',
                    color: formPrenom.trim() ? 'white' : '#9CA3AF',
                  }}
                >
                  {editingMember ? 'Enregistrer' : 'Ajouter ce membre'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
              <Text
                className="text-2xl text-text-primary"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                🔗 Inviter par code
              </Text>
              <Pressable
                onPress={() => setShowInviteModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              {/* Role selection for invite */}
              <View className="mb-6">
                <Text
                  className="text-base text-text-primary mb-3"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Quel rôle aura cette personne ?
                </Text>
                {(['helper', 'viewer'] as FamilyRole[]).map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setFormRole(role)}
                      className="p-4 rounded-xl mb-2"
                      style={{
                        backgroundColor: formRole === role ? `${config.color}10` : '#F9FAFB',
                        borderWidth: formRole === role ? 2 : 1,
                        borderColor: formRole === role ? config.color : '#E5E7EB',
                      }}
                    >
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{config.icon}</Text>
                        <View className="flex-1">
                          <Text
                            className="text-base"
                            style={{ 
                              fontFamily: 'Nunito_700Bold', 
                              color: formRole === role ? config.color : '#374151' 
                            }}
                          >
                            {config.label}
                          </Text>
                          <Text
                            className="text-sm"
                            style={{ fontFamily: 'Nunito_400Regular', color: '#6B7280' }}
                          >
                            {config.description}
                          </Text>
                        </View>
                        {formRole === role && (
                          <Check size={24} color={config.color} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Generated code display */}
              {generatedCode ? (
                <Animated.View
                  entering={FadeIn.duration(400)}
                  className="items-center py-8"
                >
                  <View
                    className="rounded-3xl p-8 items-center"
                    style={{ backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#C7D2FE' }}
                  >
                    <Text
                      className="text-sm text-text-secondary mb-2"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      Code d'invitation
                    </Text>
                    <Text
                      className="text-5xl tracking-widest"
                      style={{ fontFamily: 'Nunito_800ExtraBold', color: '#4F46E5' }}
                    >
                      {generatedCode}
                    </Text>
                    <Text
                      className="text-sm text-text-muted mt-3"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      Valable 7 jours
                    </Text>
                  </View>

                  <View className="flex-row space-x-3 mt-6">
                    <Pressable
                      onPress={handleCopyCode}
                      className="flex-1 rounded-xl py-4 flex-row items-center justify-center active:scale-95"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <Copy size={20} color="#374151" />
                      <Text
                        className="text-base ml-2"
                        style={{ fontFamily: 'Nunito_600SemiBold', color: '#374151' }}
                      >
                        Copier
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={handleShareInvite}
                      className="flex-1 rounded-xl py-4 flex-row items-center justify-center active:scale-95"
                      style={{ backgroundColor: '#2563EB' }}
                    >
                      <Share2 size={20} color="white" />
                      <Text
                        className="text-base text-white ml-2"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        Partager
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              ) : (
                <Pressable
                  onPress={handleGenerateInvite}
                  className="rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98]"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  <Link size={24} color="white" />
                  <Text
                    className="text-lg text-white ml-3"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Générer un code
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
