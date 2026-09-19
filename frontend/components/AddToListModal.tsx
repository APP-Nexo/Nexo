import { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { libraryApi, type LibraryListDTO } from '../services/library';
import { ApiError } from '../services/api';
import CreateListModal from './CreateListModal';

type AddToListModalProps = {
  visible: boolean;
  onClose: () => void;
  gameId: number;
};

// PUT /library/lists/:id/games/:gameId 404s if the game isn't already in the
// user's library. Try the add first (the common case once a game has been
// favorited/rated), and only touch the library — with a neutral default that
// won't clobber an existing favorite/status — as a fallback.
async function addGameToListEnsuringLibrary(token: string, listId: number, gameId: number) {
  try {
    const { item } = await libraryApi.addGameToList(token, listId, gameId);
    return item;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    await libraryApi.upsertGame(token, gameId, { status: 'want_to_play' });
    const { item } = await libraryApi.addGameToList(token, listId, gameId);
    return item;
  }
}

export default function AddToListModal({ visible, onClose, gameId }: AddToListModalProps) {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [lists, setLists] = useState<LibraryListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { lists: fetched } = await libraryApi.lists(token);
      setLists(fetched);
    } catch {
      showError('Não foi possível carregar suas listas.');
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function toggleList(list: LibraryListDTO) {
    if (!token || savingId !== null) return;
    const alreadyIn = list.items.some((item) => item.gameId === gameId);
    setSavingId(list.id);
    try {
      if (alreadyIn) {
        await libraryApi.removeGameFromList(token, list.id, gameId);
        setLists((prev) =>
          prev.map((l) =>
            l.id === list.id ? { ...l, items: l.items.filter((i) => i.gameId !== gameId) } : l,
          ),
        );
      } else {
        const item = await addGameToListEnsuringLibrary(token, list.id, gameId);
        setLists((prev) =>
          prev.map((l) => (l.id === list.id ? { ...l, items: [...l.items, item] } : l)),
        );
      }
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível atualizar a lista.');
    } finally {
      setSavingId(null);
    }
  }

  function handleCreated(list: LibraryListDTO) {
    setLists((prev) => [list, ...prev]);
    showSuccess('Lista criada!');
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>ADICIONAR À LISTA</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.nexoBlue} style={{ marginVertical: SPACING.lg }} />
            ) : (
              <ScrollView style={styles.listScroll}>
                {lists.length === 0 ? (
                  <Text style={styles.emptyText}>Você ainda não tem listas.</Text>
                ) : (
                  lists.map((list) => {
                    const checked = list.items.some((item) => item.gameId === gameId);
                    return (
                      <Pressable
                        key={list.id}
                        style={styles.listRow}
                        onPress={() => toggleList(list)}
                        disabled={savingId !== null}
                      >
                        <Text style={styles.listName} numberOfLines={1}>
                          {list.name}
                        </Text>
                        {savingId === list.id ? (
                          <ActivityIndicator color={COLORS.nexoBlue} size="small" />
                        ) : (
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked && <Ionicons name="checkmark" size={14} color={COLORS.bodyBackground} />}
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}

            <Pressable style={styles.newListButton} onPress={() => setCreateOpen(true)}>
              <Ionicons name="add" size={16} color={COLORS.nexoBlue} />
              <Text style={styles.newListText}>NOVA LISTA</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CreateListModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </>
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
    maxHeight: '70%',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.small,
    letterSpacing: 2,
  },
  listScroll: {
    maxHeight: 260,
  },
  emptyText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.small,
    paddingVertical: SPACING.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  listName: {
    flex: 1,
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.nexoBlue,
  },
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderStyle: 'dashed',
  },
  newListText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
});
