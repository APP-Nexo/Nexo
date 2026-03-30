import React, { useState } from 'react';
import Logo from '../../components/logo';
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
import { COLORS, SPACING, FONT } from '../../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }

    Alert.alert('Login', 'Aqui depois vocês conectam com o backend.');
  }

  function handleCreateAccount() {
    Alert.alert('Criar conta', 'Depois vocês podem navegar para a tela de cadastro.');
  }

  function handleForgotPassword() {
    Alert.alert('Recuperar senha', 'Fluxo de recuperação ainda não implementado.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.logoBox}>
                <View style={styles.logoBox}>
                    <Logo size={40} />
                </View>
                <Text style={styles.tagline}>rate games • own your taste</Text>
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

                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.showButton}
                    >
                      <Text style={styles.showButtonText}>
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable onPress={handleForgotPassword} style={styles.forgotButton}>
                  <Text style={styles.forgotText}>ESQUECI A SENHA</Text>
                </Pressable>

                <Pressable onPress={handleLogin} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>ENTRAR</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OU CONTINUE COM</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>GOOGLE</Text>
                  </Pressable>

                  <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>DISCORD</Text>
                  </Pressable>

                  <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>STEAM</Text>
                  </Pressable>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Novo por aqui?</Text>
                  <Pressable onPress={handleCreateAccount}>
                    <Text style={styles.createAccountText}>Criar conta</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  card: {
    borderRadius: 28,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 36,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoBlue: {
    color: COLORS.primary,
  },
  logoWhite: {
    color: COLORS.text,
  },
  logoPink: {
    color: COLORS.secondary,
  },
  tagline: {
    marginTop: 8,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: COLORS.primary,
    fontSize: FONT.small,
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingLeft: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  showButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  showButtonText: {
    color: COLORS.warning,
    fontSize: FONT.small,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 4,
  },
  forgotText: {
    color: COLORS.secondary,
    fontSize: FONT.small,
    letterSpacing: 1,
  },
  primaryButton: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#04141A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
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
  socialButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT.text,
  },
  createAccountText: {
    color: COLORS.primary,
    fontSize: FONT.text,
    fontWeight: '700',
  },
});