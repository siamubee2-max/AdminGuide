import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Trash2,
  Clock,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeInRight,
  SlideInRight,
} from 'react-native-reanimated';
import {
  useHistoryStore,
  ActionType,
  ACTION_CONFIG,
  formatRelativeTime,
  groupActionsByDay,
  getDateGroupLabel,
  HistoryAction,
} from '@/lib/state/history-store';
import { useDocumentStore } from '@/lib/state/document-store';
import { useTranslation } from '@/lib/i18n';

const FILTER_OPTIONS: { id: ActionType | 'all'; labelKey: string; icon: string }[] = [
  { id: 'all', labelKey: 'history.all', icon: '📋' },
  { id: 'scan', labelKey: 'history.scans_filter', icon: '📷' },
  { id: 'reminder_set', labelKey: 'history.reminders_filter', icon: '⏰' },
  { id: 'voice_question', labelKey: 'history.voice', icon: '🎤' },
  { id: 'shared', labelKey: 'history.shares', icon: '🔗' },
];

export default function HistoriqueScreen() {
  const router = useRouter();
  const t = useTranslation();
  const [activeFilter, setActiveFilter] = useState<ActionType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const actions = useHistoryStore((s) => s.actions);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);
  const documents = useDocumentStore((s) => s.documents);

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Filter and group actions
  const { filteredActions, groupedActions, stats } = useMemo(() => {
    const filtered = activeFilter === 'all' 
      ? actions 
      : actions.filter(a => a.type === activeFilter);
    
    const grouped = groupActionsByDay(filtered);
    
    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayCount = actions.filter(a => a.timestamp >= todayTimestamp).length;
    const scansCount = actions.filter(a => a.type === 'scan').length;
    const remindersCount = actions.filter(a => a.type === 'reminder_set' || a.type === 'reminder_done').length;
    
    return {
      filteredActions: filtered,
      groupedActions: grouped,
      stats: { todayCount, scansCount, remindersCount },
    };
  }, [actions, activeFilter]);

  const handleActionPress = (action: HistoryAction) => {
    if (action.documentId) {
      const doc = documents.find(d => String(d.id) === action.documentId);
      if (doc) {
        setCurrentDocument(doc);
        router.push('/resultat');
      }
    }
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center active:opacity-70"
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
            
            {actions.length > 0 && (
              <Pressable
                onPress={handleClearHistory}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Trash2 size={20} color="white" />
              </Pressable>
            )}
          </View>
          
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: 'Nunito_800ExtraBold' }}
          >
            {t('history.title')}
          </Text>
          <Text
            className="text-lg text-white/80 mt-1"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {t('history.subtitle')}
          </Text>
        </Animated.View>

        {/* Stats summary */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(100)}
          className="px-6 mb-4"
        >
          <View className="flex-row space-x-3">
            <View 
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-white/70 text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {t('history.today')}
              </Text>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {stats.todayCount}
              </Text>
            </View>
            <View 
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-white/70 text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {t('history.scans')}
              </Text>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {stats.scansCount}
              </Text>
            </View>
            <View 
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-white/70 text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {t('history.reminders')}
              </Text>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Nunito_800ExtraBold' }}>
                {stats.remindersCount}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Filter chips */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(200)}
          className="mb-4"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  className="flex-row items-center px-4 py-2.5 rounded-full active:scale-95"
                  style={{
                    backgroundColor: isActive ? 'white' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{filter.icon}</Text>
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      color: isActive ? '#7C3AED' : 'white',
                    }}
                  >
                    {t(filter.labelKey as any)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Actions list */}
        <View className="flex-1 bg-background rounded-t-3xl overflow-hidden">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredActions.length === 0 ? (
              <Animated.View
                entering={FadeIn.duration(500)}
                className="items-center py-16"
              >
                <View 
                  className="w-24 h-24 rounded-full items-center justify-center mb-6"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <Clock size={48} color="#9CA3AF" />
                </View>
                <Text
                  className="text-xl text-text-primary text-center mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {t('history.empty')}
                </Text>
                <Text
                  className="text-base text-text-secondary text-center px-8"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {t('history.empty_msg')}
                </Text>
              </Animated.View>
            ) : (
              Array.from(groupedActions.entries()).map(([dateKey, dayActions], groupIndex) => (
                <Animated.View
                  key={dateKey}
                  entering={FadeInUp.duration(400).delay(groupIndex * 100)}
                  className="mb-6"
                >
                  {/* Date header */}
                  <View className="flex-row items-center mb-4">
                    <View 
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: '#EDE9FE' }}
                    >
                      <Calendar size={16} color="#7C3AED" />
                    </View>
                    <Text
                      className="text-base text-text-primary"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      {getDateGroupLabel(dateKey)}
                    </Text>
                    <View 
                      className="ml-auto px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <Text
                        className="text-xs text-text-secondary"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        {t('history.actions_count', { count: dayActions.length, s: dayActions.length > 1 ? 's' : '' })}
                      </Text>
                    </View>
                  </View>

                  {/* Timeline */}
                  <View className="pl-4 border-l-2 border-gray-200">
                    {dayActions.map((action, actionIndex) => {
                      const config = ACTION_CONFIG[action.type];
                      return (
                        <Animated.View
                          key={action.id}
                          entering={SlideInRight.duration(300).delay(actionIndex * 50)}
                        >
                          <Pressable
                            onPress={() => handleActionPress(action)}
                            disabled={!action.documentId}
                            className="flex-row items-start mb-4 -ml-5 active:opacity-70"
                          >
                            {/* Timeline dot */}
                            <View 
                              className="w-8 h-8 rounded-full items-center justify-center border-2 border-white z-10"
                              style={{ 
                                backgroundColor: config.color,
                                shadowColor: config.color,
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>{config.icon}</Text>
                            </View>
                            
                            {/* Content */}
                            <View 
                              className="flex-1 ml-3 p-4 rounded-2xl"
                              style={{ 
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#F3F4F6',
                                shadowColor: '#000',
                                shadowOpacity: 0.03,
                                shadowRadius: 8,
                                elevation: 1,
                              }}
                            >
                              <View className="flex-row items-center justify-between mb-1">
                                <Text
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ 
                                    fontFamily: 'Nunito_600SemiBold',
                                    backgroundColor: `${config.color}15`,
                                    color: config.color,
                                  }}
                                >
                                  {config.label}
                                </Text>
                                <Text
                                  className="text-xs text-text-muted"
                                  style={{ fontFamily: 'Nunito_400Regular' }}
                                >
                                  {formatRelativeTime(action.timestamp)}
                                </Text>
                              </View>
                              
                              <Text
                                className="text-base text-text-primary mt-1"
                                style={{ fontFamily: 'Nunito_700Bold' }}
                                numberOfLines={2}
                              >
                                {action.title}
                              </Text>
                              
                              {action.description && (
                                <Text
                                  className="text-sm text-text-secondary mt-1"
                                  style={{ fontFamily: 'Nunito_400Regular' }}
                                  numberOfLines={2}
                                >
                                  {action.description}
                                </Text>
                              )}

                              {action.documentTitle && (
                                <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                                  <Text style={{ fontSize: 12 }}>📄</Text>
                                  <Text
                                    className="text-xs text-primary ml-1 flex-1"
                                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                                    numberOfLines={1}
                                  >
                                    {action.documentTitle}
                                  </Text>
                                  {action.documentId && (
                                    <ChevronRight size={14} color="#2563EB" />
                                  )}
                                </View>
                              )}
                            </View>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}
