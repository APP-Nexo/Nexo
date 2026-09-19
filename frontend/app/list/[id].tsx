import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { libraryApi, type LibraryListDTO } from '../../services/library';
import { ApiError } from '../../services/api';
import { useSafeBack } from '../../hooks/useSafeBack';

const COLUMNS = 3;
const GAP = SPACING.xs;
const FALLBACK_IMAGE = require('../../assets/images/Elden_Ring_capa.jpg');

export default function ListDetailScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const itemWidth = (width - SPACING.lg * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const router = useRouter();
  const goBack = useSafeBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { showError } = useToast();

  const [list, setList] = useState<LibraryListDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(false);
    try {
      const { lists } = await libraryApi.lists(token);
      const match = lists.find((l) => String(l.id) === id);
      if (!match) {
        setError(true);
      } else {
        setList(match);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function removeGame(gameId: number) {
    if (!token || !list || removingId !== null) return;
    setRemovingId(gameId);
    try {
      await libraryApi.removeGameFromList(token, list.id, gameId);
      setList({ ...list, items: list.items.filter((item) => item.gameId !== gameId) });
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível remover o jogo.');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.nexoBlue} />
      </View>
    );
  }

  if (error || !list) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top, paddingHorizontal: SPACING.lg }]}>
        <ErrorState message="Não foi possível carregar esta lista." onRetry={load} />
        <Pressable onPress={goBack} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.nexoBlue, fontFamily: FONT.family.display }}>VOLTAR</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{list.name}</Text>
          <Text style={styles.subtitle}>
            {list.isPublic ? 'PÚBLICA' : 'PRIVADA'} • {list.items.length}{' '}
            {list.items.length === 1 ? 'JOGO' : 'JOGOS'}
          </Text>
        </View>
      </View>

      {list.items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Essa lista ainda não tem jogos.</Text>
        </View>
      ) : (
        <FlatList
          data={list.items}
          key={COLUMNS}
          numColumns={COLUMNS}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth }}>
              <Pressable onPress={() => router.push(`/games/${item.gameId}`)}>
                <Image
                  source={item.game.cover ? { uri: item.game.cover } : FALLBACK_IMAGE}
                  style={[styles.cover, { width: itemWidth, height: itemWidth * 1.4 }]}
                  contentFit="cover"
                />
                <Text style={styles.gameTitle} numberOfLines={2}>
                  {item.game.title}
                </Text>
              </Pressable>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeGame(item.gameId)}
                disabled={removingId !== null}
              >
                {removingId === item.gameId ? (
                  <ActivityIndicator color={COLORS.nexoPink} size="small" />
                ) : (
                  <Text style={styles.removeText}>REMOVER</Text>
                )}
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  centered: {
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
  title: {
    fontFamily: FONT.family.display,
    fontSize: FONT.subtitle,
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.small,
    textAlign: 'center',
  },
  grid: {
    padding: SPACING.lg,
  },
  cover: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxs,
  },
  gameTitle: {
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.caption,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  removeButton: {
    marginTop: SPACING.xxs,
    paddingVertical: 3,
  },
  removeText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
