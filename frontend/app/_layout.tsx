import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingScreen from '../components/LoadingScreen';

import {
  useFonts,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';

import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
} from '@expo-google-fonts/rajdhani';

const MINIMUM_LOADING_MS = 5000;

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Orbitron_900Black,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
  });

  const [isMinimumTimeDone, setIsMinimumTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMinimumTimeDone(true), MINIMUM_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !isMinimumTimeDone) {
    return <LoadingScreen />;
  }

  const TextAny = Text as any;
  const TextInputAny = TextInput as any;

  TextAny.defaultProps = {
    ...TextAny.defaultProps,
    style: [
      { fontFamily: 'Rajdhani_500Medium' },
      TextAny.defaultProps?.style,
    ],
  };

  TextInputAny.defaultProps = {
    ...TextInputAny.defaultProps,
    style: [
      { fontFamily: 'Rajdhani_500Medium' },
      TextInputAny.defaultProps?.style,
    ],
  };

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="games/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
