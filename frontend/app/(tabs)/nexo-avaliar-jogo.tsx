import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants';
import ErrorState from '../../components/ErrorState';
import GameCover from '../../components/GameCover';
import { gamesApi, type GameResponse } from '../../services/games';

const SEARCH_DEBOUNCE_MS = 400;

export default function GamesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 48) / 2;
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [games, setGames] = useState<GameResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery);
  }, [initialQuery]);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(false);
    try {
      const page = await gamesApi.list({ q: q.trim() || undefined, limit: 20 });
      setGames(page.data);
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, load]);

  async function loadMore() {
    if (cursor === null || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await gamesApi.list({ q: query.trim() || undefined, limit: 20, cursor });
      setGames((prev) => [...prev, ...page.data]);
      setCursor(page.nextCursor);
    } catch {
      // best-effort; onEndReached will simply fire again on next scroll
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jogos</Text>

      <TextInput
        placeholder="Buscar jogo..."
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading && games.length === 0 ? (
        <ActivityIndicator color={COLORS.nexoBlue} style={{ marginTop: SPACING.xl }} />
      ) : error ? (
        <ErrorState message="Não foi possível carregar os jogos." onRetry={() => load(query)} />
      ) : games.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum jogo encontrado para "{query}".</Text>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={COLORS.nexoBlue} style={{ marginTop: SPACING.md }} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { width: cardWidth }]}
              onPress={() => router.push(`/games/${item.id}`)}
            >
              <GameCover
                uri={item.cover}
                style={[styles.image, { width: cardWidth }]}
                radius={0}
                iconSize={32}
              />

              <View style={styles.infoContainer}>
                <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                  {item.title.toUpperCase()}
                </Text>
                <Text style={styles.genre} numberOfLines={1} ellipsizeMode="tail">
                  {item.genres.slice(0, 2).join(' • ').toUpperCase() || 'SEM GÊNERO'}
                </Text>

                <Text style={styles.stars}>
                  {item.averageRating > 0 ? `★ ${item.averageRating.toFixed(1)}` : 'SEM NOTAS'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
    paddingHorizontal: 16,
    paddingTop: 60,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  input: {
    height: 48,
    backgroundColor: '#0E1621',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1F2A37',
  },

  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },

  card: {
    marginBottom: 20,
  },

  image: {
    height: 180,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },

  infoContainer: {
    backgroundColor: '#0E1621',
    padding: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    height: 106,
    justifyContent: 'space-between',
  },

  genre: {
    color: '#6B7280',
    fontSize: 10,
  },

  stars: {
    color: '#00E0FF',
    fontSize: 12,
  },
});
