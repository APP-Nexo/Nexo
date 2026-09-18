import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export default function ErrorState({
  message = 'Não foi possível carregar. Verifique sua conexão.',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>TENTAR NOVAMENTE</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerCompact: {
    paddingVertical: SPACING.md,
  },
  message: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  retryText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
});
