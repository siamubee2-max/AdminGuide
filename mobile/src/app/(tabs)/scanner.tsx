import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, RotateCcw, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useDocumentStore } from '@/lib/state/document-store';
import { useHistoryStore } from '@/lib/state/history-store';
import { analyzeDocumentWithAI } from '@/lib/services/ai-service';
import { Document, URGENCE_STYLES } from '@/lib/types';
import { usePremium } from '@/lib/hooks/usePremium';
import { useTranslation } from '@/lib/i18n';

type ScanState = 'ready' | 'capturing' | 'preview' | 'analyzing' | 'error';

export default function ScannerScreen() {
  const t = useTranslation();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const cameraRef = useRef<CameraView>(null);

  const addDocument = useDocumentStore((s) => s.addDocument);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);
  const addAction = useHistoryStore((s) => s.addAction);
  const { requirePremium } = usePremium();

  // Animations
  const scanLinePosition = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.6);
  const cornerPulse = useSharedValue(1);
  const analyzeProgress = useSharedValue(0);

  React.useEffect(() => {
    scanLinePosition.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 })
      ),
      -1,
      true
    );

    cornerPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  React.useEffect(() => {
    if (scanState === 'analyzing') {
      analyzeProgress.value = withTiming(0.9, { duration: 8000, easing: Easing.out(Easing.ease) });
    } else {
      analyzeProgress.value = 0;
    }
  }, [scanState]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${interpolate(scanLinePosition.value, [0, 1], [10, 90])}%`,
    opacity: pulseOpacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerPulse.value }],
    opacity: pulseOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${analyzeProgress.value * 100}%`,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setScanState('capturing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setScanState('preview');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Error capturing photo:', error);
      setScanState('ready');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanState('ready');
    setErrorMessage('');
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    if (!requirePremium()) return;

    setScanState('analyzing');
    setAnalysisStep(t('scanner.step_reading'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Read image as base64
      let imageBase64 = '';
      try {
        const base64 = await FileSystem.readAsStringAsync(capturedImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageBase64 = base64;
        setAnalysisStep(t('scanner.step_analyzing'));
      } catch (e) {
        console.log('Error reading file, using camera base64');
      }

      // Call AI analysis
      setAnalysisStep(t('scanner.step_understanding'));
      const analysis = await analyzeDocumentWithAI(imageBase64, capturedImage);

      setAnalysisStep(t('scanner.step_preparing'));
      
      // Complete progress animation
      analyzeProgress.value = withTiming(1, { duration: 500 });
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Get the urgence style
      const urgenceStyle = URGENCE_STYLES[analysis.urgence];

      // Create document
      const newDocument: Document = {
        id: Date.now(),
        type: analysis.type,
        organisme: analysis.organisme,
        titre: analysis.titre,
        urgence: analysis.urgence,
        urgenceLabel: urgenceStyle.label,
        urgenceIcon: urgenceStyle.icon,
        montant: analysis.montant || undefined,
        dateLimite: analysis.dateLimite || undefined,
        explication: analysis.explication,
        action: analysis.action,
        categorie: analysis.categorie || 'tous',
        imageUri: capturedImage,
        dateAjout: new Date().toISOString().split('T')[0],
        contenuBrut: analysis.contenuBrut || undefined,
      };

      addDocument(newDocument);
      setCurrentDocument(newDocument);
      
      // Track in history
      addAction({
        type: 'scan',
        title: `Document scanné : ${newDocument.titre}`,
        description: `${newDocument.type} de ${newDocument.organisme}`,
        documentId: String(newDocument.id),
        documentTitle: newDocument.titre,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/resultat');
      
    } catch (error) {
      console.error('Analysis error:', error);
      setScanState('error');
      setErrorMessage(t('scanner.error_msg'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (!permission) {
    return (
      <LinearGradient colors={['#1E40AF', '#1E3A8A']} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#1E40AF', '#1E3A8A']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Animated.View 
            entering={FadeInDown.duration(600).springify()}
            className="items-center"
          >
            <View 
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text style={{ fontSize: 64 }}>📷</Text>
            </View>
            <Text
              className="text-3xl text-white text-center mb-4"
              style={{ fontFamily: 'Nunito_800ExtraBold' }}
            >
              {t('scanner.permission_title')}
            </Text>
            <Text
              className="text-lg text-white/80 text-center mb-10 leading-7"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {t('scanner.permission_msg')}
            </Text>
            <Pressable
              onPress={requestPermission}
              className="rounded-2xl py-5 px-12 active:scale-95"
              style={{ backgroundColor: 'white' }}
            >
              <Text
                className="text-xl"
                style={{ fontFamily: 'Nunito_700Bold', color: '#1E40AF' }}
              >
                {t('scanner.permission_btn')}
              </Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const ScanCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const positionStyles = {
      tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
      tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
      bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
      br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    };

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderColor: '#60A5FA',
            borderRadius: 4,
            ...positionStyles[position],
          },
          cornerStyle,
        ]}
      />
    );
  };

  return (
    <LinearGradient
      colors={['#1E40AF', '#1E3A8A', '#172554']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(400)}
          className="px-6 pt-4 pb-6"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-5 active:opacity-70"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ChevronLeft size={24} color="white" />
            </View>
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {t('scanner.back')}
            </Text>
          </Pressable>

          <View className="flex-row items-center">
            <Text style={{ fontSize: 32 }}>📄</Text>
            <View className="ml-3">
              <Text
                className="text-3xl text-white"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {t('scanner.title')}
              </Text>
              <Text
                className="text-lg text-white/70 mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {scanState === 'analyzing'
                  ? analysisStep
                  : scanState === 'error'
                  ? t('scanner.error_status')
                  : t('scanner.instruction')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Camera / Preview Area */}
        <View className="flex-1 mx-6 mb-6">
          <View
            className="flex-1 rounded-3xl overflow-hidden"
            style={{
              borderWidth: 3,
              borderColor: scanState === 'analyzing' ? '#10B981' : scanState === 'error' ? '#EF4444' : '#60A5FA',
              backgroundColor: '#0F172A',
            }}
          >
            {scanState === 'preview' || scanState === 'analyzing' || scanState === 'error' ? (
              <View className="flex-1">
                {capturedImage && (
                  <Image
                    source={{ uri: capturedImage }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                )}
                {scanState === 'analyzing' && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <View 
                      className="items-center p-8 rounded-3xl mx-6"
                      style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                    >
                      <View 
                        className="w-20 h-20 rounded-full items-center justify-center mb-5"
                        style={{ backgroundColor: '#DBEAFE' }}
                      >
                        <Sparkles size={40} color="#2563EB" />
                      </View>
                      <Text
                        className="text-2xl text-text-primary mb-2 text-center"
                        style={{ fontFamily: 'Nunito_800ExtraBold' }}
                      >
                        {t('scanner.analyzing_title')}
                      </Text>
                      <Text
                        className="text-base text-text-secondary mb-5 text-center"
                        style={{ fontFamily: 'Nunito_400Regular' }}
                      >
                        {analysisStep}
                      </Text>
                      
                      <View 
                        className="w-48 h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: '#E5E7EB' }}
                      >
                        <Animated.View
                          style={[
                            {
                              height: '100%',
                              backgroundColor: '#2563EB',
                              borderRadius: 999,
                            },
                            progressStyle,
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}
                {scanState === 'error' && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <View 
                      className="items-center p-8 rounded-3xl mx-6"
                      style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                    >
                      <View 
                        className="w-20 h-20 rounded-full items-center justify-center mb-5"
                        style={{ backgroundColor: '#FEE2E2' }}
                      >
                        <Text style={{ fontSize: 40 }}>😕</Text>
                      </View>
                      <Text
                        className="text-xl text-text-primary mb-2 text-center"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {t('scanner.error_title')}
                      </Text>
                      <Text
                        className="text-base text-text-secondary text-center"
                        style={{ fontFamily: 'Nunito_400Regular' }}
                      >
                        {errorMessage}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={facing}
              >
                <View className="flex-1 items-center justify-center p-6">
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 0.72,
                      position: 'relative',
                    }}
                  >
                    <ScanCorner position="tl" />
                    <ScanCorner position="tr" />
                    <ScanCorner position="bl" />
                    <ScanCorner position="br" />

                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          left: 8,
                          right: 8,
                          height: 3,
                          borderRadius: 2,
                        },
                        scanLineStyle,
                      ]}
                    >
                      <LinearGradient
                        colors={['transparent', '#60A5FA', '#60A5FA', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1, borderRadius: 2 }}
                      />
                    </Animated.View>

                    <View className="flex-1 items-center justify-center">
                      <View 
                        className="rounded-2xl px-6 py-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                      >
                        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>📄</Text>
                        <Text
                          className="text-white text-lg text-center"
                          style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                          {t('scanner.place_doc')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </CameraView>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          className="px-6 pb-6"
        >
          {scanState === 'ready' && (
            <Pressable
              onPress={handleCapture}
              className="rounded-3xl py-5 flex-row items-center justify-center active:scale-[0.98]"
              style={{
                backgroundColor: '#10B981',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Camera size={26} color="white" />
              </View>
              <Text
                className="text-2xl text-white"
                style={{ fontFamily: 'Nunito_800ExtraBold' }}
              >
                {t('scanner.capture_btn')}
              </Text>
            </Pressable>
          )}

          {scanState === 'capturing' && (
            <View className="items-center py-5">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <Text
                  className="text-white text-xl ml-3"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {t('scanner.captured')}
                </Text>
              </View>
            </View>
          )}

          {(scanState === 'preview' || scanState === 'error') && (
            <View className="space-y-4">
              {scanState === 'preview' && (
                <Pressable
                  onPress={handleAnalyze}
                  className="rounded-3xl py-5 flex-row items-center justify-center active:scale-[0.98]"
                  style={{
                    backgroundColor: '#10B981',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Sparkles size={26} color="white" />
                  </View>
                  <Text
                    className="text-2xl text-white"
                    style={{ fontFamily: 'Nunito_800ExtraBold' }}
                  >
                    {t('scanner.analyze_btn')}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleRetake}
                className="rounded-3xl py-4 flex-row items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <RotateCcw size={22} color="white" />
                <Text
                  className="text-lg text-white ml-3"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {scanState === 'error' ? t('scanner.retry') : t('scanner.retake')}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
