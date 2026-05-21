import { Stack } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  useFonts,
  Orbitron_900Black,
} from '@expo-google-fonts/orbitron';

import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
} from '@expo-google-fonts/rajdhani';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Orbitron_900Black,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
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