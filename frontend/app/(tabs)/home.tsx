import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import Carousel from '@/components/Carrousel';
import ActivityCard from '@/components/ActivityCard';
import ErrorState from '@/components/ErrorState';
import { COLORS, SPACING, FONT } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { gamesApi, type GameResponse } from '@/services/games';
import { socialApi, type FeedItem } from '@/services/social';
import { meApi } from '@/services/me';
import type { Game } from '@/types/Game';

function toCarouselGame(g: GameResponse): Game {
  return {
    id: String(g.id),
    title: g.title,
    category: g.genres[0] ?? 'JOGO',
    cover: g.cover,
    rating: g.averageRating,
    genres: g.genres,
  };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { token } = useAuth();

  const [trending, setTrending] = useState<Game[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedCursor, setFeedCursor] = useState<number | null>(null);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [initials, setInitials] = useState('');
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    // Only show the full-screen spinner on the very first load; a refocus
    // (e.g. coming back from rating a game) refreshes quietly so the feed
    // doesn't flash back to a loading state the user already saw.
    if (!hasLoadedOnce.current) setLoading(true);
    setError(false);
    try {
      const [trendingPage, feedPage, me] = await Promise.all([
        gamesApi.trending(10),
        token ? socialApi.feed(token) : Promise.resolve({ feed: [], nextCursor: null }),
        token ? meApi.get(token).catch(() => null) : Promise.resolve(null),
      ]);
      setTrending(trendingPage.data.map(toCarouselGame));
      setFeed(feedPage.feed);
      setFeedCursor(feedPage.nextCursor);
      if (me) {
        setInitials(me.username.slice(0, 2).toUpperCase());
        setMyUserId(me.id);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function loadMoreFeed() {
    if (!token || feedCursor === null || feedLoadingMore) return;
    setFeedLoadingMore(true);
    try {
      const page = await socialApi.feed(token, feedCursor);
      setFeed((prev) => [...prev, ...page.feed]);
      setFeedCursor(page.nextCursor);
    } catch {
      // best-effort; the button just stays put so the user can retry
    } finally {
      setFeedLoadingMore(false);
    }
  }

  function goToSearch() {
    if (searchQuery.trim()) {
      router.push({ pathname: '/(tabs)/nexo-avaliar-jogo', params: { q: searchQuery.trim() } });
    }
  }

  const showFeedList = !loading && !error;

  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        data={showFeedList ? feed : []}
        keyExtractor={(item) => String(item.id)}
        onEndReachedThreshold={0.4}
        onEndReached={showFeedList ? loadMoreFeed : undefined}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <MaskedView
                  maskElement={
                    <View style={styles.maskContainer}>
                      <Text style={[styles.logoText, { fontSize: 30 }]}>NEXO</Text>
                    </View>
                  }
                >
                  <LinearGradient
                    colors={['#20E3FF', '#7DEBFF', '#FFD0E5', '#FF2D7A']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0.8, y: 0.5 }}
                    style={[styles.gradient, { height: 30 * 1.25 }]}
                  />
                </MaskedView>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileIcon}>
                  <Text style={styles.profileText}>{initials || '••'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="BUSCAR JOGOS..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={goToSearch}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter') goToSearch();
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.nexoBlue} style={{ marginTop: SPACING.xl }} />
            ) : error ? (
              <View style={{ paddingHorizontal: 16 }}>
                <ErrorState message="Não foi possível carregar a home." onRetry={load} />
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>EM ALTA</Text>
                  <Text style={styles.sectionLink} onPress={() => router.push('/(tabs)/nexo-avaliar-jogo')}>
                    VER TODOS
                  </Text>
                </View>

                {trending.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum jogo em alta no momento.</Text>
                ) : (
                  <Carousel
                    data={trending}
                    style={{ marginBottom: 30 }}
                    onPressItem={(game) => router.push(`/games/${game.id}`)}
                  />
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ATIVIDADES RECENTES</Text>
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          showFeedList ? (
            <Text style={styles.emptyText}>
              Nenhuma atividade ainda. Siga outros usuários ou avalie um jogo para ver algo aqui.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.feedItemWrap}>
            <ActivityCard
              userInitials={item.userUsername.slice(0, 2).toUpperCase()}
              username={item.userUsername}
              time={timeAgo(item.createdAt)}
              action="avaliou"
              gameTitle={item.review.gameTitle}
              rating={item.review.rating}
              comment={item.review.text ?? undefined}
              gameCover={item.review.gameCover}
              progressStatus={item.review.progressStatus}
              isOwn={myUserId !== null && item.userId === myUserId}
              onPressUser={() => router.push(`/user/${item.userUsername}`)}
              onPressGame={() => router.push(`/games/${item.review.gameId}`)}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.feedFooter}>
            {feedLoadingMore && <ActivityIndicator color={COLORS.nexoBlue} style={styles.footerSpinner} />}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  content: {
    paddingTop: 20,
  },
  header: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  maskContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: 100,
  },
  logoText: {
    fontFamily: FONT.family.display,
    fontWeight: '900',
    letterSpacing: 2,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontFamily: FONT.family.display,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.nexoBlue,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchInput: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#00E0FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionLink: {
    color: '#5F6C7B',
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    paddingHorizontal: 16,
    marginBottom: SPACING.lg,
  },
  feedItemWrap: {
    paddingHorizontal: 16,
  },
  feedFooter: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  footerSpinner: {
    marginTop: SPACING.xs,
  },
});
