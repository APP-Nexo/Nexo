import { Platform } from 'react-native';

export * from './colors';
export * from './spacing';
export * from './typography';
// React Native Web has no native animation driver; passing useNativeDriver:
// true there is a no-op that also logs a warning on every animation.
export const NATIVE_DRIVER = Platform.OS !== 'web';
export const GLOW = {
  primary: {
    boxShadow: '0px 0px 3px rgba(32, 227, 255, 0.6)',
    elevation: 10,
  }
}