import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import { gamesApi, type GameResponse } from '../../services/games';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const FALLBACK_IMAGE = require('../../assets/images/Elden_Ring_capa.jpg');
const SEARCH_DEBOUNCE_MS = 400;

export default function GamesScreen() {
  const router = useRouter();
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery);
  }, [initialQuery]);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(false);
    try {
      const page = await gamesApi.list({ q: q.trim() || undefined, limit: 30 });
      setGames(page.data);
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
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/games/${item.id}`)}>
              <View style={styles.imageContainer}>
                <Image
                  source={item.cover ? { uri: item.cover } : FALLBACK_IMAGE}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title.toUpperCase()}
                </Text>
                <Text style={styles.genre} numberOfLines={1}>
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
    width: CARD_WIDTH,
    marginBottom: 20,
  },

  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  imageContainer: {
    position: 'relative',
  },

  infoContainer: {
    backgroundColor: '#0E1621',
    padding: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 100,
    justifyContent: 'space-around',
  },

  genre: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },

  stars: {
    color: '#00E0FF',
    marginTop: 6,
    fontSize: 12,
  },
});
