import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, RotateCcw, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useDocumentStore } from '@/lib/state/document-store';
import { Document } from '@/lib/types';

type ScanState = 'ready' | 'capturing' | 'preview' | 'analyzing';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const addDocument = useDocumentStore((s) => s.addDocument);
  const setCurrentDocument = useDocumentStore((s) => s.setCurrentDocument);

  const pulseOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setScanState('capturing');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setScanState('preview');
      }
    } catch (error) {
      console.log('Error capturing photo:', error);
      setScanState('ready');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanState('ready');
  };

  const handleAnalyze = async () => {
    setScanState('analyzing');

    // Simulate AI analysis (in production, this would call the AI API)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Create a mock analyzed document
    const newDocument: Document = {
      id: Date.now(),
      type: 'Courrier',
      organisme: 'Document scann\u00e9',
      titre: 'Nouveau document',
      urgence: 'orange',
      urgenceLabel: 'Cette semaine',
      urgenceIcon: '!',
      explication: "Ce document a \u00e9t\u00e9 scann\u00e9 et analys\u00e9 par MonAdmin. Veuillez v\u00e9rifier les d\u00e9tails et l'action recommand\u00e9e.",
      action: 'V\u00e9rifier et traiter ce document',
      categorie: 'tous',
      imageUri: capturedImage ?? undefined,
      dateAjout: new Date().toISOString().split('T')[0],
    };

    addDocument(newDocument);
    setCurrentDocument(newDocument);
    router.push('/resultat');
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-primary-dark">
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 64, marginBottom: 24 }}>📸</Text>
          <Text
            className="text-2xl text-white text-center mb-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Autoriser la cam\u00e9ra
          </Text>
          <Text
            className="text-lg text-white/80 text-center mb-8"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            Pour scanner vos courriers, MonAdmin a besoin d'acc\u00e9der à votre cam\u00e9ra.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-white rounded-2xl py-5 px-10 active:opacity-90"
          >
            <Text
              className="text-primary text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Autoriser l'acc\u00e8s
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0D47A1', '#1A237E']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-4"
          >
            <ChevronLeft size={28} color="white" />
            <Text
              className="text-white text-lg ml-2"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Retour
            </Text>
          </Pressable>
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: 'Nunito_800ExtraBold' }}
          >
            Scanner un courrier
          </Text>
          <Text
            className="text-lg text-white/80 mt-2"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {scanState === 'analyzing'
              ? 'MonAdmin lit votre courrier...'
              : 'Placez le document dans le cadre'}
          </Text>
        </View>

        {/* Camera / Preview Area */}
        <View className="flex-1 mx-6 mb-6">
          <View
            className="flex-1 rounded-3xl overflow-hidden"
            style={{
              borderWidth: 4,
              borderColor: '#5C6BC0',
            }}
          >
            {scanState === 'preview' || scanState === 'analyzing' ? (
              <View className="flex-1 bg-secondary">
                {capturedImage && (
                  <Image
                    source={{ uri: capturedImage }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                )}
                {scanState === 'analyzing' && (
                  <View
                    className="absolute inset-0 bg-black/50 items-center justify-center"
                  >
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      className="items-center"
                    >
                      <ActivityIndicator size="large" color="#81C784" />
                      <Text
                        className="text-white text-xl mt-6"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Analyse en cours...
                      </Text>
                      <Text
                        className="text-white/80 text-base mt-2"
                        style={{ fontFamily: 'Nunito_400Regular' }}
                      >
                        Un instant s'il vous plaît
                      </Text>
                    </Animated.View>
                  </View>
                )}
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={facing}
              >
                {/* Scanning Frame Overlay */}
                <View className="flex-1 items-center justify-center p-8">
                  <Animated.View
                    style={[
                      {
                        width: '100%',
                        aspectRatio: 0.7,
                        borderWidth: 4,
                        borderStyle: 'dashed',
                        borderColor: '#64B5F6',
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      pulseStyle,
                    ]}
                  >
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
                    <Text
                      className="text-white text-lg text-center"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      Placez votre courrier ici
                    </Text>
                  </Animated.View>
                </View>
              </CameraView>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-6">
          {scanState === 'ready' && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <Pressable
                onPress={handleCapture}
                className="bg-success rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
                style={{
                  minHeight: 72,
                  shadowColor: '#4CAF50',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Camera size={28} color="white" />
                <Text
                  className="text-xl text-white ml-4"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Prendre la photo
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {scanState === 'capturing' && (
            <View className="items-center py-5">
              <ActivityIndicator size="large" color="white" />
              <Text
                className="text-white text-lg mt-4"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Photo prise !
              </Text>
            </View>
          )}

          {scanState === 'preview' && (
            <View className="space-y-4">
              <Animated.View entering={FadeInUp.duration(300)}>
                <Pressable
                  onPress={handleAnalyze}
                  className="bg-success rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
                  style={{
                    minHeight: 72,
                    shadowColor: '#4CAF50',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Check size={28} color="white" />
                  <Text
                    className="text-xl text-white ml-4"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Analyser ce courrier
                  </Text>
                </Pressable>
              </Animated.View>
              <Animated.View entering={FadeInUp.duration(300).delay(100)}>
                <Pressable
                  onPress={handleRetake}
                  className="bg-white/20 rounded-2xl py-5 flex-row items-center justify-center active:opacity-90"
                  style={{ minHeight: 72 }}
                >
                  <RotateCcw size={24} color="white" />
                  <Text
                    className="text-lg text-white ml-3"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    Reprendre la photo
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
