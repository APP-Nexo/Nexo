import { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT } from '@/constants';
import ErrorState from '@/components/ErrorState';
import GameCover from '@/components/GameCover';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { meApi } from '@/services/me';
import { usersApi, type UserPublicProfile, type UserStatsDTO, type PublicUserReview, type PublicUserList } from '@/services/users';
import { socialApi } from '@/services/social';
import { ApiError } from '@/services/api';
import { useSafeBack } from '@/hooks/useSafeBack';

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

export default function PublicProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useSafeBack();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { token } = useAuth();
  const { showError } = useToast();

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [reviews, setReviews] = useState<PublicUserReview[]>([]);
  const [reviewsCursor, setReviewsCursor] = useState<number | null>(null);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [lists, setLists] = useState<PublicUserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [notasExpanded, setNotasExpanded] = useState(false);
  const [atividadeExpanded, setAtividadeExpanded] = useState(false);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!token || !username) return;
    // Only show the full-screen spinner on the very first load; a refocus
    // refreshes quietly so the screen doesn't flash back to a loading state
    // the user already saw.
    if (!hasLoadedOnce.current) setLoading(true);
    setError(false);
    try {
      const me = await meApi.get(token);
      if (me.username === username) {
        setRedirecting(true);
        router.replace('/(tabs)/profile');
        return;
      }

      const [profileRes, statsRes, reviewsRes, listsRes] = await Promise.all([
        usersApi.get(token, username),
        usersApi.stats(username),
        usersApi.reviews(token, username),
        usersApi.lists(token, username),
      ]);
      setProfile(profileRes);
      setStats(statsRes);
      setReviews(reviewsRes.reviews);
      setReviewsCursor(reviewsRes.nextCursor);
      setLists(listsRes.lists);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [token, username, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function loadMoreReviews() {
    if (!token || !username || reviewsCursor === null || reviewsLoadingMore) return;
    setReviewsLoadingMore(true);
    try {
      const page = await usersApi.reviews(token, username, reviewsCursor);
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

  async function toggleFollow() {
    if (!token || !profile || followSaving) return;
    const next = !profile.isFollowing;
    setProfile({ ...profile, isFollowing: next, followersCount: profile.followersCount + (next ? 1 : -1) });
    setFollowSaving(true);
    try {
      if (next) {
        await socialApi.follow(token, profile.username);
      } else {
        await socialApi.unfollow(token, profile.username);
      }
    } catch (error) {
      setProfile(profile);
      showError(error instanceof ApiError ? error.message : 'Não foi possível atualizar o follow.');
    } finally {
      setFollowSaving(false);
    }
  }

  if (redirecting) return null;

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.nexoBlue} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top, paddingHorizontal: SPACING.lg }]}>
        <ErrorState message="Não foi possível carregar este perfil." onRetry={load} />
        <Pressable onPress={goBack} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.nexoBlue, fontFamily: FONT.family.display }}>VOLTAR</Text>
        </Pressable>
      </View>
    );
  }

  const initials = profile.username.slice(0, 2).toUpperCase();
  const ratingsSorted = [...reviews].sort((a, b) => b.rating - a.rating);
  const ratingsVisible = notasExpanded ? ratingsSorted : ratingsSorted.slice(0, PREVIEW_COUNT);
  const activityVisible = atividadeExpanded ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.headerMain}>
            <View style={styles.avatar}>
              {profile.photo ? (
                <Image source={{ uri: profile.photo }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                {profile.username}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.followButton, profile.isFollowing && styles.followButtonActive]}
            onPress={toggleFollow}
            disabled={followSaving}
          >
            <Text
              style={[styles.followButtonText, profile.isFollowing && styles.followButtonTextActive]}
            >
              {profile.isFollowing ? 'SEGUINDO' : 'SEGUIR'}
            </Text>
          </Pressable>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats?.totalGames ?? 0} label="JOGOS" />
          <View style={styles.statDivider} />
          <StatBox value={stats?.totalReviews ?? 0} label="REVIEWS" />
          <View style={styles.statDivider} />
          <StatBox
            value={profile.followingCount}
            label="SEGUINDO"
            onPress={() => router.push({ pathname: '/social/[username]', params: { username: profile.username, type: 'following' } })}
          />
          <View style={styles.statDivider} />
          <StatBox
            value={profile.followersCount}
            label="SEGUIDORES"
            onPress={() => router.push({ pathname: '/social/[username]', params: { username: profile.username, type: 'followers' } })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTAS</Text>
          {ratingsSorted.length === 0 ? (
            <Text style={styles.emptyText}>Ainda não avaliou nenhum jogo.</Text>
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
          <Text style={styles.sectionTitle}>ATIVIDADE RECENTE</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
          ) : (
            <>
              {activityVisible.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} username={profile.username} />
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
          <Text style={styles.sectionTitle}>LISTAS PÚBLICAS</Text>
          {lists.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma lista pública ainda.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {lists.map((list) => (
                <Pressable
                  key={list.id}
                  style={styles.listCard}
                  onPress={() =>
                    router.push({ pathname: '/list/[id]', params: { id: String(list.id), username } })
                  }
                >
                  <Text style={styles.listCardTitle} numberOfLines={2}>
                    {list.name}
                  </Text>
                  <Text style={styles.listCardCount}>{list.itemCount} jogos</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
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
        <View style={[styles.ratingBarFill, { width: fillPercent, backgroundColor: barColor }]} />
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
        <Text style={styles.activityAction}>review publicada</Text>
        <Text style={styles.activityMeta}>
          {username} • {timeAgo(entry.createdAt)}
        </Text>
      </View>
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
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
  content: {
    padding: SPACING.lg,
    gap: SPACING.xl,
    paddingBottom: SPACING.xxxl,
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
  followButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  followButtonActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.borderLight,
  },
  followButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  followButtonTextActive: {
    color: COLORS.textSecondary,
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

  horizontalList: {
    gap: SPACING.sm,
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
