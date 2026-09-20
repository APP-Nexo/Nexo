import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '@/constants';
import FeaturedGame from '@/components/FeaturedGame';
import ActivityCard from '@/components/ActivityCard';
import PrimaryButton from '@/components/PrimaryButton';
import ErrorState from '@/components/ErrorState';
import AddToListModal from '@/components/AddToListModal';
import GameCover from '@/components/GameCover';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { gamesApi, type GameDetailResponse, type GameReviewResponse, type GameResponse } from '@/services/games';
import { libraryApi } from '@/services/library';
import { ApiError } from '@/services/api';
import { useSafeBack } from '@/hooks/useSafeBack';

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
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showError } = useToast();

  const [descExpanded, setDescExpanded] = useState(false);
  const [game, setGame] = useState<GameDetailResponse | null>(null);
  const [reviews, setReviews] = useState<GameReviewResponse[]>([]);
  const [reviewsCursor, setReviewsCursor] = useState<string | null>(null);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [similarGames, setSimilarGames] = useState<GameResponse[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const loadedForId = useRef<string | null>(null);

  const load = useCallback(async () => {
    // Only show the full-screen spinner the first time this game id loads;
    // a refocus (e.g. coming back from editing a review) refreshes quietly
    // so the page doesn't flash back to a loading state the user already saw.
    if (loadedForId.current !== id) setLoading(true);
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
      setReviewsCursor(reviewsPage.nextCursor);
      setSimilarGames(similarPage.data.filter((g) => g.id !== detail.id).slice(0, 6));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      loadedForId.current = id;
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function loadMoreReviews() {
    if (!id || reviewsCursor === null || reviewsLoadingMore) return;
    setReviewsLoadingMore(true);
    try {
      const page = await gamesApi.reviews(id, { cursor: reviewsCursor });
      setReviews((prev) => [...prev, ...page.data]);
      setReviewsCursor(page.nextCursor);
    } catch {
      // best-effort; onEndReached will simply fire again on next scroll
    } finally {
      setReviewsLoadingMore(false);
    }
  }

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
        <Pressable onPress={goBack} style={{ marginTop: SPACING.md }}>
          <Text style={{ color: COLORS.nexoBlue, fontFamily: FONT.family.display }}>VOLTAR</Text>
        </Pressable>
      </View>
    );
  }

  const stats = [
    { value: String(game.ratingCount), label: 'AVALIAÇÕES' },
    { value: game.averageRating > 0 ? game.averageRating.toFixed(1) : '—', label: 'NOTA MÉDIA' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        onEndReachedThreshold={0.4}
        onEndReached={loadMoreReviews}
        ListHeaderComponent={
          <>
            <FeaturedGame
              title={game.title}
              cover={game.cover}
              rating={game.averageRating}
              genres={game.genres}
              topInset={insets.top}
              onBackPress={goBack}
              onFavoritePress={toggleFavorite}
              isFavorited={isFavorite}
            />

            <View style={styles.content}>
              <PrimaryButton
                title={game.viewer?.review ? 'EDITAR MINHA REVIEW' : '+ AVALIAR ESTE JOGO'}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/rate-game',
                    params: { id: String(game.id), title: game.title },
                  })
                }
              />

              <Pressable style={styles.addToListButton} onPress={() => setListModalOpen(true)}>
                <Text style={styles.addToListText}>+ ADICIONAR À LISTA</Text>
              </Pressable>

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

              <View style={[styles.sectionHeader, styles.reviewsSectionHeader]}>
                <Text style={styles.sectionTitle}>REVIEWS RECENTES</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.reviewItemWrap}>
            <Text style={styles.emptyText}>Ainda não há reviews para este jogo. Seja o primeiro!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewItemWrap}>
            <ActivityCard
              userInitials={initialsOf(item.user.username)}
              username={item.user.username}
              time={timeAgo(item.createdAt)}
              action="avaliou"
              gameTitle={game.title}
              rating={item.rating}
              comment={item.text ?? undefined}
              gameCover={game.cover}
              progressStatus={item.progressStatus}
              isOwn={game.viewer?.review?.id === item.id}
              onPressUser={() => router.push(`/user/${item.user.username}`)}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footerWrap}>
            {reviewsLoadingMore && (
              <ActivityIndicator color={COLORS.nexoBlue} style={styles.footerSpinner} />
            )}

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
                      <GameCover uri={g.cover} style={styles.similarImage} radius={RADIUS.lg} />
                      <Text style={styles.similarTitle} numberOfLines={2} ellipsizeMode="tail">
                        {g.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        }
      />

      <AddToListModal
        visible={listModalOpen}
        onClose={() => setListModalOpen(false)}
        gameId={game.id}
      />
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
  addToListButton: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToListText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    letterSpacing: 1,
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
  reviewsSectionHeader: {
    marginBottom: SPACING.sm,
  },
  reviewItemWrap: {
    paddingHorizontal: SPACING.gutter,
  },
  footerWrap: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.xl,
  },
  footerSpinner: {
    marginBottom: SPACING.md,
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
