import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT, GLOW, RADIUS, SPACING } from '@/constants';

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (value: string) => value.length >= 8 },
  { label: 'Uma letra maiúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Um número', test: (value: string) => /\d/.test(value) },
  { label: 'Um caractere especial', test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const;

const STRENGTH_LEVELS = [
  { label: 'FRACA', color: COLORS.textMuted },
  { label: 'FRACA', color: COLORS.nexoPink },
  { label: 'MÉDIA', color: COLORS.nexoGold },
  { label: 'MÉDIA', color: COLORS.nexoGold },
  { label: 'FORTE', color: COLORS.statusGreen },
] as const;

if (__DEV__) {
  console.assert(
    PASSWORD_RULES.every((rule) => rule.test('Nexo123!')) &&
      !PASSWORD_RULES[3].test('Nexo123 '),
    'A senha de controle deve atender a todos os requisitos.'
  );
}

type PasswordFieldProps = {
  label?: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordField({
  label,
  value,
  visible,
  onChangeText,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={COLORS.nexoBlue}
          placeholder="••••••••"
          placeholderTextColor={COLORS.placeholder}
          accessibilityLabel={label ?? 'Confirmar nova senha'}
        />
        <Pressable
          onPress={onToggleVisibility}
          style={styles.eyeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const requirements = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    met: rule.test(newPassword),
  }));
  const strengthScore = requirements.filter((requirement) => requirement.met).length;
  const strength = STRENGTH_LEVELS[strengthScore];
  const strengthWidth = `${strengthScore * 25}%` as `${number}%`;
  const passwordsMatch = newPassword.length > 0 && confirmation === newPassword;
  const passwordsDiffer = newPassword.length > 0 && confirmation.length > 0 && !passwordsMatch;
  const canSubmit =
    currentPassword.length > 0 && strengthScore === PASSWORD_RULES.length && passwordsMatch;

  function handleSubmit() {
    Alert.alert('Senha alterada', 'Sua nova senha foi confirmada localmente.');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.nexoBlue} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>MUDAR SENHA</Text>
            <Text style={styles.headerSubtitle}>CRIE UMA NOVA SENHA</Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar alteração de senha"
          >
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SENHA ATUAL</Text>
          <PasswordField
            label="SENHA ATUAL"
            value={currentPassword}
            visible={showCurrentPassword}
            onChangeText={setCurrentPassword}
            onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOVA SENHA</Text>
          <PasswordField
            label="NOVA SENHA"
            value={newPassword}
            visible={showNewPassword}
            onChangeText={setNewPassword}
            onToggleVisibility={() => setShowNewPassword((value) => !value)}
          />

          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                { width: strengthWidth, backgroundColor: strength.color },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIRMAR NOVA SENHA</Text>
          <PasswordField
            value={confirmation}
            visible={showConfirmation}
            onChangeText={setConfirmation}
            onToggleVisibility={() => setShowConfirmation((value) => !value)}
          />

          {passwordsMatch && (
            <Text style={styles.matchFeedback}>AS SENHAS COINCIDEM ✓</Text>
          )}
          {passwordsDiffer && (
            <Text style={styles.mismatchFeedback}>AS SENHAS AINDA NÃO COINCIDEM</Text>
          )}
        </View>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>REQUISITOS</Text>
          {requirements.map((requirement) => (
            <View key={requirement.label} style={styles.requirementRow}>
              <Ionicons
                name={requirement.met ? 'checkmark' : 'close'}
                size={16}
                color={requirement.met ? COLORS.statusGreen : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.requirementText,
                  requirement.met && styles.requirementTextMet,
                ]}
              >
                {requirement.label}
              </Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          title="CONFIRMAR SENHA"
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={canSubmit ? styles.confirmButton : undefined}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.subtitle,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 1,
    marginTop: 2,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontFamily: FONT.family.body,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
  },
  eyeButton: {
    height: '100%',
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthTrack: {
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.disabled,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: RADIUS.round,
  },
  strengthLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  matchFeedback: {
    fontFamily: FONT.family.display,
    color: COLORS.statusGreen,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  mismatchFeedback: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  requirementsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    gap: SPACING.xxs,
  },
  requirementsTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 1,
    marginBottom: SPACING.xxs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  requirementText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.small,
  },
  requirementTextMet: {
    color: COLORS.statusGreen,
  },
  confirmButton: {
    ...GLOW.primary,
  },
});
