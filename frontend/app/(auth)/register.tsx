import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { COLORS, SPACING, FONT } from '../../constants';
import Logo from '../../components/logo';
import PrimaryButton from '@/components/PrimaryButton';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleRegister() {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senha inválida', 'As senhas não coincidem.');
      return;
    }

    Alert.alert('Cadastro', 'Depois vocês conectam com o backend.');
  }

  function handleGoogleRegister() {
    console.log('Cadastro com Google');
  }

  function handleDiscordRegister() {
    console.log('Cadastro com Discord');
  }

  function handleSteamRegister() {
    console.log('Cadastro com Steam');
  }

  function togglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  function toggleConfirmPasswordVisibility() {
    setShowConfirmPassword((prev) => !prev);
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.phoneFrame}>
            <View style={styles.card}>
              <View style={styles.logoBox}>
                <Logo size={40} />
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>USUÁRIO OU E-MAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SENHA</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable onPress={togglePasswordVisibility} style={styles.eyeButton}>
                      <Text style={styles.eyeButtonText}>{showPassword ? 'Ocultar' : '👁'}</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRMAR SENHA</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable onPress={toggleConfirmPasswordVisibility} style={styles.eyeButton}>
                      <Text style={styles.eyeButtonText}>
                        {showConfirmPassword ? 'Ocultar' : '👁'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                    <PrimaryButton
                      title="CADASTRAR"
                      onPress={handleRegister}
                      style={{ }}
                    />

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OU CONTINUE COM</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable style={styles.socialButton} onPress={handleGoogleRegister}>
                    <Text style={styles.socialButtonText}>GOOGLE</Text>
                  </Pressable>

                  <Pressable style={styles.socialButton} onPress={handleDiscordRegister}>
                    <Text style={styles.socialButtonText}>DISCORD</Text>
                  </Pressable>

                  <Pressable style={styles.socialButton} onPress={handleSteamRegister}>
                    <Text style={styles.socialButtonText}>STEAM</Text>
                  </Pressable>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Já tem uma conta?</Text>

                  <Link href="../login" asChild>
                    <Pressable>
                      <Text style={styles.footerLink}>LOG IN</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView> 
    </View>
  );
}

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: COLORS.bodyBackground,
},
keyboardArea: {
  flex: 1,
},
container: {
  flex: 1,
  justifyContent: 'center',
  backgroundColor: COLORS.bodyBackground,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.lg,
},
  phoneFrame: {
  flex: 1,
  backgroundColor: COLORS.bodyBackground,
  paddingHorizontal: 0,
  paddingTop: 40,
  paddingBottom: 28,
  justifyContent: 'center',
},
  card: {
    borderRadius: 28,
    backgroundColor: COLORS.bodyBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 36,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 36,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.small,
    letterSpacing: 1,
  },
  input: {
    fontFamily: FONT.family.body,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  passwordWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    fontFamily: FONT.family.body,
    flex: 1,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  eyeButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  eyeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    backgroundColor: 'rgba(0, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: COLORS.nexoBlue,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonIcon: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  socialButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.text,
  },
});