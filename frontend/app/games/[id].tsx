import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '@/constants';
import FeaturedGame from '@/components/FeaturedGame';
import ActivityCard from '@/components/ActivityCard';
import PrimaryButton from '@/components/PrimaryButton';
import ErrorState from '@/components/ErrorState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { gamesApi, type GameDetailResponse, type GameReviewResponse, type GameResponse } from '@/services/games';
import { libraryApi } from '@/services/library';
import { ApiError } from '@/services/api';

const FALLBACK_IMAGE = require('../../assets/images/Elden_Ring_capa.jpg');

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days / 30);
  return `${months}mês atrás`;
}

function initialsOf(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export default function GameDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showError } = useToast();

  const [descExpanded, setDescExpanded] = useState(false);
  const [game, setGame] = useState<GameDetailResponse | null>(null);
  const [reviews, setReviews] = useState<GameReviewResponse[]>([]);
  const [similarGames, setSimilarGames] = useState<GameResponse[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const detail = await gamesApi.detail(id, token);
      setGame(detail);
      setIsFavorite(detail.viewer?.library?.isFavorite ?? false);

      const [reviewsPage, similarPage] = await Promise.all([
        gamesApi.reviews(id).catch(() => ({ data: [], nextCursor: null })),
        detail.genres[0]
          ? gamesApi.list({ genre: detail.genres[0], limit: 8 }).catch(() => ({ data: [], nextCursor: null }))
          : Promise.resolve({ data: [], nextCursor: null }),
      ]);
      setReviews(reviewsPage.data);
      setSimilarGames(similarPage.data.filter((g) => g.id !== detail.id).slice(0, 6));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFavorite() {
    if (!token || !game || favoriteSaving) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setFavoriteSaving(true);
    try {
      await libraryApi.upsertGame(token, game.id, { isFavorite: next });
    } catch (error) {
      setIsFavorite(!next);
      showError(error instanceof ApiError ? error.message : 'Não foi possível favoritar o jogo.');
    } finally {
      setFavoriteSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={COLORS.nexoBlue} />
      </View>
    );
  }

  if (loadError || !game) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ErrorState message="Não foi possível carregar este jogo." onRetry={load} />
        <Pressable onPress={() => router.back()} style={{ marginTop: SPACING.md }}>
          <Text style={{ color: COLORS.nexoBlue, fontFamily: FONT.family.display }}>VOLTAR</Text>
        </Pressable>
      </View>
    );
  }

  const gameImageSource: ImageSourcePropType = game.cover ? { uri: game.cover } : FALLBACK_IMAGE;
  const stats = [
    { value: String(game.ratingCount), label: 'AVALIAÇÕES' },
    { value: game.averageRating > 0 ? game.averageRating.toFixed(1) : '—', label: 'NOTA MÉDIA' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
      >
        <FeaturedGame
          title={game.title}
          image={game.cover ?? FALLBACK_IMAGE}
          rating={game.averageRating}
          genres={game.genres}
          topInset={insets.top}
          onBackPress={() => router.back()}
          onFavoritePress={toggleFavorite}
          isFavorited={isFavorite}
        />

        <View style={styles.content}>
          <PrimaryButton
            title="+ AVALIAR ESTE JOGO"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/rate-game',
                params: { id: String(game.id), title: game.title },
              })
            }
          />

          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index < stats.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SOBRE O JOGO</Text>
              {game.description && (
                <Pressable onPress={() => setDescExpanded((v) => !v)}>
                  <Text style={styles.sectionAction}>{descExpanded ? 'MENOS' : 'LER MAIS'}</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.description} numberOfLines={descExpanded ? undefined : 3}>
              {game.description ?? 'Ainda não temos uma descrição para este jogo.'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>REVIEWS RECENTES</Text>
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.emptyText}>Ainda não há reviews para este jogo. Seja o primeiro!</Text>
            ) : (
              reviews.map((review) => (
                <ActivityCard
                  key={review.id}
                  userInitials={initialsOf(review.user.username)}
                  username={review.user.username}
                  time={timeAgo(review.createdAt)}
                  action="avaliou"
                  gameTitle={game.title}
                  rating={review.rating}
                  comment={review.text ?? undefined}
                  gameImage={gameImageSource}
                />
              ))
            )}
          </View>

          {similarGames.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>JOGOS SIMILARES</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: SPACING.sm }}
              >
                {similarGames.map((g) => (
                  <Pressable
                    key={g.id}
                    style={styles.similarCard}
                    onPress={() => router.push(`/games/${g.id}`)}
                  >
                    <Image
                      source={g.cover ? { uri: g.cover } : FALLBACK_IMAGE}
                      style={styles.similarImage}
                      contentFit="cover"
                    />
                    <Text style={styles.similarTitle} numberOfLines={2}>
                      {g.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.lg,
    gap: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  statValue: {
    fontFamily: FONT.family.display,
    fontSize: FONT.subtitle,
    color: COLORS.nexoBlue,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xxs,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    color: COLORS.nexoBlue,
    letterSpacing: 2,
  },
  sectionAction: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
  similarCard: {
    width: 92,
  },
  similarImage: {
    width: 92,
    height: 130,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  similarTitle: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.text,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
});
