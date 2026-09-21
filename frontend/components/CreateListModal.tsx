import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { libraryApi, type LibraryListDTO } from '../services/library';
import { ApiError } from '../services/api';

type CreateListModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: (list: LibraryListDTO) => void;
  /** When provided, the modal edits this list instead of creating a new one. */
  list?: { id: number; name: string; isPublic: boolean };
};

export default function CreateListModal({ visible, onClose, onSaved, list }: CreateListModalProps) {
  const { token } = useAuth();
  const { showError } = useToast();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(list);

  useEffect(() => {
    if (!visible) return;
    setName(list?.name ?? '');
    setIsPublic(list?.isPublic ?? true);
  }, [visible, list]);

  async function handleSave() {
    if (!token || !name.trim() || saving) return;
    setSaving(true);
    try {
      const result = isEditing
        ? await libraryApi.updateList(token, list!.id, { name: name.trim(), isPublic })
        : await libraryApi.createList(token, { name: name.trim(), isPublic });
      onSaved(result.list);
      onClose();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : `Não foi possível ${isEditing ? 'salvar' : 'criar'} a lista.`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{isEditing ? 'EDITAR LISTA' : 'NOVA LISTA'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome da lista"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus
          />

          <View style={styles.visibilityRow}>
            <Pressable
              style={[styles.visibilityOption, isPublic && styles.visibilityOptionActive]}
              onPress={() => setIsPublic(true)}
            >
              <Text style={[styles.visibilityText, isPublic && styles.visibilityTextActive]}>
                PÚBLICA
              </Text>
            </Pressable>
            <Pressable
              style={[styles.visibilityOption, !isPublic && styles.visibilityOptionActive]}
              onPress={() => setIsPublic(false)}
            >
              <Text style={[styles.visibilityText, !isPublic && styles.visibilityTextActive]}>
                PRIVADA
              </Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </Pressable>
            <Pressable
              style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.bodyBackground} size="small" />
              ) : (
                <Text style={styles.createText}>{isEditing ? 'SALVAR' : 'CRIAR'}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.small,
    letterSpacing: 2,
  },
  input: {
    fontFamily: FONT.family.body,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  visibilityOption: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityOptionActive: {
    borderColor: COLORS.nexoBlue,
    backgroundColor: 'rgba(0,240,255,0.08)',
  },
  visibilityText: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  visibilityTextActive: {
    color: COLORS.nexoBlue,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  createButton: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.nexoBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createText: {
    fontFamily: FONT.family.display,
    color: COLORS.bodyBackground,
    fontSize: FONT.caption,
    letterSpacing: 1,
    fontWeight: '700',
  },
});
