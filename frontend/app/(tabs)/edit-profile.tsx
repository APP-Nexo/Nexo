import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSafeBack } from '../../hooks/useSafeBack';
import { meApi } from '../../services/me';
import { ApiError, resolveMediaUrl } from '../../services/api';

// expo-image-picker's web implementation ignores the `quality`/`allowsEditing`
// options entirely and hands back the original file as-is — a real phone
// photo easily lands well above the backend's 5MB upload limit. Re-encode it
// through a canvas so web uploads stay small regardless of the source file.
const WEB_UPLOAD_MAX_DIMENSION = 1200;
const WEB_UPLOAD_QUALITY = 0.8;

async function compressImageForWeb(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, WEB_UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', WEB_UPLOAD_QUALITY),
  );
  return blob ?? file;
}

async function assetToFormPart(
  asset: ImagePicker.ImagePickerAsset,
): Promise<Blob | { uri: string; name: string; type: string }> {
  if (Platform.OS === 'web' && asset.file) {
    try {
      return await compressImageForWeb(asset.file);
    } catch {
      return asset.file;
    }
  }
  return {
    uri: asset.uri,
    name: asset.fileName ?? `upload-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const BIO_MAX_LENGTH = 500;
const PASSWORD_MIN_LENGTH = 10;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useSafeBack();
  const { token, logout } = useAuth();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bannerAsset, setBannerAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [removingBanner, setRemovingBanner] = useState(false);

  const [dangerExpanded, setDangerExpanded] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // This screen lives inside the tabs navigator, so it never unmounts when
  // the user navigates away — it just loses focus. `token` also changes in
  // the background (~every 15min, on refresh) while the user might still be
  // actively editing here. We need to load fresh data on every genuine
  // re-visit (e.g. after a failed save, the fields must show the real saved
  // values again, not the rejected attempt) WITHOUT reloading on every token
  // refresh while the user stays put (which would clobber in-progress
  // edits). `useFocusEffect` with a stable (empty-deps) callback gives us
  // exactly that: it only fires on real navigation focus/blur, never just
  // because `token` changed — so the token is read from a ref instead of a
  // dependency.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const currentToken = tokenRef.current;
      if (currentToken && !hasLoadedRef.current) {
        (async () => {
          try {
            const me = await meApi.get(currentToken);
            if (cancelled) return;
            hasLoadedRef.current = true;
            setEmail(me.email);
            setUsername(me.username);
            setOriginalUsername(me.username);
            setBio(me.profile?.bio ?? '');
            setOriginalBio(me.profile?.bio ?? '');
            setPhotoUrl(me.profile?.photo ?? null);
            setBannerUrl(me.profile?.banner ?? null);
            // A fresh load reflects what's actually saved — any unsaved
            // pending pick (e.g. from a failed save) is abandoned once the
            // user has left and come back.
            setPhotoAsset(null);
            setBannerAsset(null);
          } catch {
            if (!cancelled) showError('Não foi possível carregar seus dados.');
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      }
      return () => {
        cancelled = true;
        hasLoadedRef.current = false;
      };
    }, []),
  );

  async function pickImage(target: 'photo' | 'banner') {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError('Precisamos de permissão para acessar suas fotos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: target === 'photo' ? [1, 1] : [3, 1],
      });
      if (result.canceled || !result.assets[0]) return;
      if (target === 'photo') setPhotoAsset(result.assets[0]);
      else setBannerAsset(result.assets[0]);
    } catch {
      showError('Não foi possível selecionar a imagem.');
    }
  }

  async function removePhoto() {
    if (photoAsset) {
      setPhotoAsset(null);
      return;
    }
    if (!token || !photoUrl || removingPhoto) return;
    setRemovingPhoto(true);
    try {
      await meApi.update(token, { photo: null });
      setPhotoUrl(null);
      showSuccess('Foto removida.');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível remover a foto.');
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function removeBanner() {
    if (bannerAsset) {
      setBannerAsset(null);
      return;
    }
    if (!token || !bannerUrl || removingBanner) return;
    setRemovingBanner(true);
    try {
      await meApi.update(token, { banner: null });
      setBannerUrl(null);
      showSuccess('Banner removido.');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível remover o banner.');
    } finally {
      setRemovingBanner(false);
    }
  }

  async function handleSaveProfile() {
    if (!token || savingProfile) return;
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < USERNAME_MIN_LENGTH || trimmedUsername.length > USERNAME_MAX_LENGTH) {
      showError(`O username deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres.`);
      return;
    }

    const usernameChanged = trimmedUsername !== originalUsername;
    const bioChanged = bio !== originalBio;
    const hasMediaChange = Boolean(photoAsset || bannerAsset);
    if (!usernameChanged && !bioChanged && !hasMediaChange) {
      showError('Nenhuma alteração para salvar.');
      return;
    }

    setSavingProfile(true);
    try {
      if (photoAsset || bannerAsset) {
        const formData = new FormData();
        if (usernameChanged) formData.append('username', trimmedUsername);
        formData.append('bio', bio);
        if (photoAsset) formData.append('photo', (await assetToFormPart(photoAsset)) as never);
        if (bannerAsset) formData.append('banner', (await assetToFormPart(bannerAsset)) as never);
        const updated = await meApi.updateMedia(token, formData);
        setPhotoUrl(updated.profile?.photo ?? null);
        setBannerUrl(updated.profile?.banner ?? null);
        setPhotoAsset(null);
        setBannerAsset(null);
      } else {
        const payload: { username?: string; bio: string } = { bio };
        if (usernameChanged) payload.username = trimmedUsername;
        await meApi.update(token, payload);
      }
      // This screen lives inside the tabs navigator and never unmounts, so
      // these need to be resynced explicitly — otherwise a later visit would
      // compare against the pre-save values again.
      setOriginalUsername(trimmedUsername);
      setOriginalBio(bio);
      showSuccess('Perfil atualizado!');
      router.replace('/(tabs)/profile');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível salvar seu perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!token || changingPassword) return;
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      showError('Preencha todos os campos de senha.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      showError(`A nova senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError('As senhas não coincidem.');
      return;
    }

    setChangingPassword(true);
    try {
      await meApi.changePassword(token, { currentPassword, newPassword });
      showSuccess('Senha alterada! Faça login novamente.');
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível alterar sua senha.');
    } finally {
      setChangingPassword(false);
    }
  }

  function handleRequestDelete() {
    if (!deletePassword.trim()) {
      showError('Informe sua senha para excluir a conta.');
      return;
    }
    setConfirmDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      await meApi.remove(token, deletePassword);
      showSuccess('Conta deletada.');
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível excluir sua conta.');
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  const photoPreview = photoAsset?.uri ?? resolveMediaUrl(photoUrl);
  const bannerPreview = bannerAsset?.uri ?? resolveMediaUrl(bannerUrl);
  const initials = (username || '?').slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>EDITAR CONTA</Text>
          {username ? (
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {username}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.nexoBlue} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + SPACING.xl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PERFIL</Text>

              <View style={styles.mediaSection}>
                <Pressable onPress={() => pickImage('banner')} style={styles.bannerPressable}>
                  {bannerPreview ? (
                    <Image source={{ uri: bannerPreview }} style={styles.bannerImage} contentFit="cover" />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={20} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Ionicons name="camera-outline" size={12} color={COLORS.text} />
                    <Text style={styles.editBadgeText}>BANNER</Text>
                  </View>
                </Pressable>

                <Pressable onPress={() => pickImage('photo')} style={styles.avatarPicker}>
                  {photoPreview ? (
                    <Image source={{ uri: photoPreview }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera-outline" size={12} color={COLORS.text} />
                  </View>
                </Pressable>
              </View>

              {(photoUrl || photoAsset || bannerUrl || bannerAsset) && (
                <View style={styles.removeMediaRow}>
                  {(photoUrl || photoAsset) && (
                    <Pressable onPress={removePhoto} disabled={removingPhoto} hitSlop={8}>
                      <Text style={styles.removeMediaText}>
                        {removingPhoto ? 'REMOVENDO...' : 'REMOVER FOTO'}
                      </Text>
                    </Pressable>
                  )}
                  {(bannerUrl || bannerAsset) && (
                    <Pressable onPress={removeBanner} disabled={removingBanner} hitSlop={8}>
                      <Text style={styles.removeMediaText}>
                        {removingBanner ? 'REMOVENDO...' : 'REMOVER BANNER'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-MAIL</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{email}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>USUÁRIO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu_usuario"
                  placeholderTextColor={COLORS.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={USERNAME_MAX_LENGTH}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>BIO</Text>
                <View style={styles.textareaContainer}>
                  <TextInput
                    style={styles.textarea}
                    placeholder="Fale um pouco sobre você."
                    placeholderTextColor={COLORS.placeholder}
                    multiline
                    maxLength={BIO_MAX_LENGTH}
                    value={bio}
                    onChangeText={setBio}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{bio.length} / {BIO_MAX_LENGTH}</Text>
                </View>
              </View>

              <PrimaryButton
                title={savingProfile ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                onPress={handleSaveProfile}
                style={{ opacity: savingProfile ? 0.6 : 1 }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ALTERAR SENHA</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>SENHA ATUAL</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textSecondary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowCurrentPassword((v) => !v)} style={styles.eyeButton}>
                    <Text style={styles.eyeButtonText}>{showCurrentPassword ? 'Ocultar' : '👁'}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOVA SENHA</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowNewPassword((v) => !v)} style={styles.eyeButton}>
                    <Text style={styles.eyeButtonText}>{showNewPassword ? 'Ocultar' : '👁'}</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>Mínimo de {PASSWORD_MIN_LENGTH} caracteres.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRMAR NOVA SENHA</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textSecondary}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showConfirmNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowConfirmNewPassword((v) => !v)} style={styles.eyeButton}>
                    <Text style={styles.eyeButtonText}>{showConfirmNewPassword ? 'Ocultar' : '👁'}</Text>
                  </Pressable>
                </View>
              </View>

              <PrimaryButton
                title={changingPassword ? 'ALTERANDO...' : 'ALTERAR SENHA'}
                onPress={handleChangePassword}
                style={{ opacity: changingPassword ? 0.6 : 1 }}
              />
            </View>

            <View style={styles.dangerSection}>
              <Text style={styles.dangerLabel}>ZONA DE PERIGO</Text>
              <Text style={styles.dangerText}>
                Excluir sua conta é permanente. Suas reviews, listas e dados serão perdidos.
              </Text>

              {!dangerExpanded ? (
                <Pressable onPress={() => setDangerExpanded(true)} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>EXCLUIR CONTA</Text>
                </Pressable>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRME SUA SENHA</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="••••••••"
                        placeholderTextColor={COLORS.textSecondary}
                        value={deletePassword}
                        onChangeText={setDeletePassword}
                        secureTextEntry={!showDeletePassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Pressable onPress={() => setShowDeletePassword((v) => !v)} style={styles.eyeButton}>
                        <Text style={styles.eyeButtonText}>{showDeletePassword ? 'Ocultar' : '👁'}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleRequestDelete}
                    disabled={deleting}
                    style={[styles.dangerButton, deleting && styles.dangerButtonDisabled]}
                  >
                    <Text style={styles.dangerButtonText}>
                      {deleting ? 'EXCLUINDO...' : 'EXCLUIR CONTA PERMANENTEMENTE'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmDeleteOpen}
        title="EXCLUIR CONTA"
        message="Tem certeza que quer excluir sua conta? Essa ação não pode ser desfeita."
        confirmLabel="EXCLUIR"
        loading={deleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT.family.display,
    fontSize: FONT.subtitle,
    color: COLORS.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.xs,
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    color: COLORS.nexoBlue,
    letterSpacing: 2,
  },
  mediaSection: {
    marginBottom: 40,
  },
  bannerPressable: {
    height: 120,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  editBadgeText: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.micro,
    letterSpacing: 0.5,
  },
  avatarPicker: {
    position: 'absolute',
    left: SPACING.md,
    bottom: -32,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.bodyBackground,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.title,
    letterSpacing: 1,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.nexoBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bodyBackground,
  },
  removeMediaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  removeMediaText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.caption,
    letterSpacing: 0.5,
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
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  readOnlyField: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.text,
  },
  textareaContainer: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  textarea: {
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    color: COLORS.text,
    minHeight: 80,
  },
  charCount: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xxs,
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
  hint: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.caption,
  },
  dangerSection: {
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.nexoPink,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  dangerLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    color: COLORS.nexoPink,
    letterSpacing: 2,
  },
  dangerText: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  dangerButton: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.nexoPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  dangerButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.caption,
    letterSpacing: 1,
    fontWeight: '700',
  },
});
