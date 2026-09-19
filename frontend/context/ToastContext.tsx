import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, NATIVE_DRIVER, RADIUS, SPACING } from '../constants';

type ToastType = 'error' | 'success';

type ToastState = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURATION_MS = 3800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: NATIVE_DRIVER }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType) => {
      nextId.current += 1;
      setToast({ id: nextId.current, type, message });
      opacity.setValue(0);
      translateY.setValue(-16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: NATIVE_DRIVER }),
      ]).start();

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(dismiss, DURATION_MS);
    },
    [dismiss, opacity, translateY],
  );

  const showError = useCallback((message: string) => show(message, 'error'), [show]);
  const showSuccess = useCallback((message: string) => show(message, 'success'), [show]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.host, { paddingTop: insets.top + SPACING.xs, pointerEvents: 'box-none' }]}
        >
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <Pressable
              onPress={dismiss}
              style={[
                styles.toast,
                toast.type === 'error' ? styles.toastError : styles.toastSuccess,
              ]}
            >
              <Text
                style={[
                  styles.message,
                  toast.type === 'error' ? styles.messageError : styles.messageSuccess,
                ]}
                numberOfLines={3}
              >
                {toast.message}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  toastError: {
    backgroundColor: '#2A0A16',
    borderColor: COLORS.nexoPink,
  },
  toastSuccess: {
    backgroundColor: '#06241A',
    borderColor: COLORS.statusGreen,
  },
  message: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    lineHeight: 18,
  },
  messageError: {
    color: COLORS.nexoPink,
  },
  messageSuccess: {
    color: COLORS.statusGreen,
  },
});
