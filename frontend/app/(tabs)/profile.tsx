import { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import CreateListModal from '../../components/CreateListModal';
import GameCover from '../../components/GameCover';
import { useAuth } from '../../context/AuthContext';
import { meApi, type MeResponse } from '../../services/me';
import { resolveMediaUrl } from '../../services/api';
import { usersApi, type PublicUserReview, type UserStatsDTO } from '../../services/users';
import { libraryApi, type LibraryGameDTO, type LibraryListDTO } from '../../services/library';

const MAX_RATING = 5;
const PREVIEW_COUNT = 5;

function renderStars(rating: number): string {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(MAX_RATING - filled);
}

function ratingBarColor(index: number): string {
  return index % 2 === 0 ? COLORS.nexoBlue : COLORS.nexoPink;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return 'hoje';
  if (days === 1) return '1 dia atrás';
  if (days < 30) return `${days} dias atrás`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, logout } = useAuth();
  const [createListOpen, setCreateListOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [favorites, setFavorites] = useState<LibraryGameDTO[]>([]);
  const [favoritesCursor, setFavoritesCursor] = useState<number | null>(null);
  const [favoritesLoadingMore, setFavoritesLoadingMore] = useState(false);
  const [reviews, setReviews] = useState<PublicUserReview[]>([]);
  const [reviewsCursor, setReviewsCursor] = useState<number | null>(null);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [lists, setLists] = useState<LibraryListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notasExpanded, setNotasExpanded] = useState(false);
  const [atividadeExpanded, setAtividadeExpanded] = useState(false);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!token) return;
    // Only show the full-screen spinner on the very first load; a refocus
    // (e.g. coming back from adding a game to a list) refreshes quietly so
    // the screen doesn't flash back to a loading state the user already saw.
    if (!hasLoadedOnce.current) setLoading(true);
    setError(false);
    try {
      const meResponse = await meApi.get(token);
      setMe(meResponse);

      const [statsResponse, favoritesResponse, reviewsResponse, listsResponse] = await Promise.all([
        usersApi.stats(meResponse.username),
        libraryApi.favorites(token, { limit: 20 }),
        usersApi.reviews(token, meResponse.username),
        libraryApi.lists(token),
      ]);
      setStats(statsResponse);
      setFavorites(favoritesResponse.games);
      setFavoritesCursor(favoritesResponse.nextCursor);
      setReviews(reviewsResponse.reviews);
      setReviewsCursor(reviewsResponse.nextCursor);
      setLists(listsResponse.lists);
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

  async function loadMoreFavorites() {
    if (!token || favoritesCursor === null || favoritesLoadingMore) return;
    setFavoritesLoadingMore(true);
    try {
      const page = await libraryApi.favorites(token, { limit: 20, cursor: favoritesCursor });
      setFavorites((prev) => [...prev, ...page.games]);
      setFavoritesCursor(page.nextCursor);
    } catch {
      // best-effort; onEndReached will simply fire again on next scroll
    } finally {
      setFavoritesLoadingMore(false);
    }
  }

  async function loadMoreReviews() {
    if (!token || !me || reviewsCursor === null || reviewsLoadingMore) return;
    setReviewsLoadingMore(true);
    try {
      const page = await usersApi.reviews(token, me.username, reviewsCursor);
      setReviews((prev) => [...prev, ...page.reviews]);
      setReviewsCursor(page.nextCursor);
    } catch {
      // best-effort; the button just stays put so the user can retry
    } finally {
      setReviewsLoadingMore(false);
    }
  }

  function toggleAtividadeExpanded() {
    const next = !atividadeExpanded;
    setAtividadeExpanded(next);
    if (next) loadMoreReviews();
  }

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.nexoBlue} />
      </View>
    );
  }

  if (error || !me) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top, paddingHorizontal: SPACING.lg }]}>
        <ErrorState message="Não foi possível carregar seu perfil." onRetry={load} />
        <Pressable onPress={handleLogout} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.textSecondary, fontFamily: FONT.family.display }}>SAIR DA CONTA</Text>
        </Pressable>
      </View>
    );
  }

  const initials = me.username.slice(0, 2).toUpperCase();
  const ratingsSorted = [...reviews].sort((a, b) => b.rating - a.rating);
  const ratingsVisible = notasExpanded ? ratingsSorted : ratingsSorted.slice(0, PREVIEW_COUNT);
  const activityVisible = atividadeExpanded ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.headerMain}>
            <View style={styles.avatar}>
              {me.profile?.photo ? (
                <Image source={{ uri: resolveMediaUrl(me.profile.photo)! }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                {me.username}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.editButton} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editButtonText}>EDITAR</Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={handleLogout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.nexoPink} />
              <Text style={styles.logoutButtonText}>SAIR</Text>
            </Pressable>
          </View>

          {me.profile?.bio ? <Text style={styles.bio}>{me.profile.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats?.totalGames ?? 0} label="JOGOS" />
          <View style={styles.statDivider} />
          <StatBox value={stats?.totalReviews ?? 0} label="REVIEWS" />
          <View style={styles.statDivider} />
          <StatBox
            value={stats?.followingCount ?? 0}
            label="SEGUINDO"
            onPress={() => router.push({ pathname: '/social/[username]', params: { username: me.username, type: 'following' } })}
          />
          <View style={styles.statDivider} />
          <StatBox
            value={stats?.followersCount ?? 0}
            label="SEGUIDORES"
            onPress={() => router.push({ pathname: '/social/[username]', params: { username: me.username, type: 'followers' } })}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="JOGOS FAVORITOS" />
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não favoritou nenhum jogo.</Text>
          ) : (
            <FlatList
              horizontal
              data={favorites}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              onEndReachedThreshold={0.4}
              onEndReached={loadMoreFavorites}
              renderItem={({ item }) => <FavoriteCard entry={item} />}
              ListFooterComponent={
                favoritesLoadingMore ? (
                  <ActivityIndicator color={COLORS.nexoBlue} style={styles.horizontalFooterSpinner} />
                ) : null
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="SUAS NOTAS" />
          {ratingsSorted.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não avaliou nenhum jogo.</Text>
          ) : (
            <>
              <View style={styles.ratingChart}>
                {ratingsVisible.map((entry, index) => (
                  <RatingRow
                    key={entry.id}
                    entry={entry}
                    barColor={ratingBarColor(index)}
                    isLast={index === ratingsVisible.length - 1}
                  />
                ))}
              </View>
              {ratingsSorted.length > PREVIEW_COUNT && (
                <ToggleMoreButton
                  expanded={notasExpanded}
                  hiddenCount={ratingsSorted.length - PREVIEW_COUNT}
                  onPress={() => setNotasExpanded((v) => !v)}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="ATIVIDADE RECENTE" />
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
          ) : (
            <>
              {activityVisible.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} username={me.username} />
              ))}
              {reviewsLoadingMore ? (
                <ActivityIndicator color={COLORS.nexoBlue} style={{ marginTop: SPACING.xs }} />
              ) : (
                (reviews.length > PREVIEW_COUNT || reviewsCursor !== null) && (
                  <ToggleMoreButton
                    expanded={atividadeExpanded}
                    hiddenCount={Math.max(reviews.length - PREVIEW_COUNT, 0)}
                    hasMoreOnServer={reviewsCursor !== null}
                    onPress={toggleAtividadeExpanded}
                  />
                )
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.listsHeaderRow}>
            <Text style={styles.sectionTitle}>LISTAS</Text>
            <Pressable style={styles.newListButton} onPress={() => setCreateListOpen(true)}>
              <Ionicons name="add" size={14} color={COLORS.nexoBlue} />
              <Text style={styles.newListButtonText}>NOVA</Text>
            </Pressable>
          </View>

          {lists.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não criou nenhuma lista.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <CreateListModal
        visible={createListOpen}
        onClose={() => setCreateListOpen(false)}
        onSaved={(list) => setLists((prev) => [list, ...prev])}
      />
    </View>
  );
}

function StatBox({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (!onPress) {
    return <View style={styles.statBox}>{content}</View>;
  }
  return (
    <Pressable style={styles.statBox} onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ToggleMoreButton({
  expanded,
  hiddenCount,
  hasMoreOnServer,
  onPress,
}: {
  expanded: boolean;
  hiddenCount: number;
  hasMoreOnServer?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.toggleMoreButton} onPress={onPress} hitSlop={8}>
      <Text style={styles.toggleMoreText}>
        {expanded ? 'ESCONDER' : `CARREGAR MAIS (${hiddenCount}${hasMoreOnServer ? '+' : ''})`}
      </Text>
    </Pressable>
  );
}

function FavoriteCard({ entry }: { entry: LibraryGameDTO }) {
  const router = useRouter();
  return (
    <Pressable style={styles.favoriteCard} onPress={() => router.push(`/games/${entry.game.id}`)}>
      <GameCover uri={entry.game.cover} style={styles.favoritePoster} radius={RADIUS.lg} />
      <Text style={styles.favoriteTitle} numberOfLines={2} ellipsizeMode="tail">
        {entry.game.title}
      </Text>
      <Text style={styles.favoriteStars}>{renderStars(entry.game.averageRating)}</Text>
    </Pressable>
  );
}

function RatingRow({
  entry,
  barColor,
  isLast,
}: {
  entry: PublicUserReview;
  barColor: string;
  isLast: boolean;
}) {
  const fillPercent = `${((entry.rating / MAX_RATING) * 100).toFixed(0)}%` as `${number}%`;
  const router = useRouter();

  return (
    <Pressable
      style={[styles.ratingRow, isLast && styles.ratingRowLast]}
      onPress={() => router.push(`/games/${entry.game.id}`)}
    >
      <View style={styles.ratingMeta}>
        <Text style={styles.ratingStars}>{renderStars(entry.rating)}</Text>
        <Text style={styles.ratingName} numberOfLines={1} ellipsizeMode="tail">
          {entry.game.title}
        </Text>
      </View>
      <View style={styles.ratingBarTrack}>
        <View
          style={[styles.ratingBarFill, { width: fillPercent, backgroundColor: barColor }]}
        />
      </View>
      <Text style={[styles.ratingValue, { color: barColor }]}>{entry.rating.toFixed(1)}</Text>
    </Pressable>
  );
}

function ActivityItem({ entry, username }: { entry: PublicUserReview; username: string }) {
  const router = useRouter();
  return (
    <Pressable style={styles.activityCard} onPress={() => router.push(`/games/${entry.game.id}`)}>
      <View style={[styles.activityAccent, { backgroundColor: COLORS.nexoBlue }]} />
      <GameCover uri={entry.game.cover} style={styles.activityThumb} radius={0} />
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1} ellipsizeMode="tail">
          {entry.game.title}
        </Text>
        <Text style={[styles.activityStars, { color: COLORS.nexoBlue }]}>
          {renderStars(entry.rating)}
        </Text>
        {entry.text ? (
          <Text style={styles.activityComment} numberOfLines={2} ellipsizeMode="tail">
            "{entry.text}"
          </Text>
        ) : null}
        <Text style={styles.activityAction}>review publicada</Text>
        <Text style={styles.activityMeta}>
          {username} • {timeAgo(entry.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function ListCard({ list }: { list: LibraryListDTO }) {
  const router = useRouter();
  return (
    <Pressable style={styles.listCard} onPress={() => router.push(`/list/${list.id}`)}>
      <Text style={styles.listCardTitle} numberOfLines={2} ellipsizeMode="tail">
        {list.name}
      </Text>
      <Text style={styles.listCardCount}>{list.itemCount} jogos</Text>
    </Pressable>
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
  content: {
    padding: SPACING.lg,
    gap: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  horizontalFooterSpinner: {
    marginLeft: SPACING.sm,
  },
  toggleMoreButton: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  toggleMoreText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },

  section: {
    gap: SPACING.sm,
  },

  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.subtitle,
    letterSpacing: 1,
  },
  userInfo: {
    flex: 1,
    gap: SPACING.xxs,
    minWidth: 0,
  },
  username: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.text,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  editButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  logoutButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  bio: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.text,
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  statValue: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.subtitle,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.micro,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xxs,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 2,
  },
  emptyText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.small,
  },

  horizontalList: {
    gap: SPACING.sm,
  },

  favoriteCard: {
    width: 110,
  },
  favoritePoster: {
    width: 110,
    height: 150,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  favoriteTitle: {
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.caption,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  favoriteStars: {
    color: COLORS.nexoBlue,
    fontSize: 11,
    marginTop: 2,
  },

  ratingChart: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ratingRowLast: {
    borderBottomWidth: 0,
  },
  ratingMeta: {
    width: 100,
  },
  ratingStars: {
    color: COLORS.nexoBlue,
    fontSize: 10,
  },
  ratingName: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    marginTop: 1,
  },
  ratingBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surface4,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: 4,
    borderRadius: RADIUS.round,
  },
  ratingValue: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    width: 28,
    textAlign: 'right',
  },

  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  activityAccent: {
    width: 3,
  },
  activityThumb: {
    width: 56,
    height: 84,
  },
  activityContent: {
    flex: 1,
    padding: SPACING.sm,
    gap: 3,
  },
  activityTitle: {
    fontFamily: FONT.family.heading,
    color: COLORS.text,
    fontSize: FONT.text,
    letterSpacing: 1,
  },
  activityStars: {
    fontSize: FONT.caption,
  },
  activityAction: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
  },
  activityMeta: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.caption,
  },
  activityComment: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 16,
  },

  listsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
  },
  newListButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  listCard: {
    width: 140,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 90,
    gap: SPACING.xs,
  },
  listCardTitle: {
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.small,
    fontWeight: '700',
    flex: 1,
  },
  listCardCount: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.caption,
  },
});
