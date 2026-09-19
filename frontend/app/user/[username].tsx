import { useCallback, useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { meApi } from '../../services/me';
import { usersApi, type UserPublicProfile, type UserStatsDTO, type PublicUserReview, type PublicUserList } from '../../services/users';
import { socialApi } from '../../services/social';
import { ApiError } from '../../services/api';
import { useSafeBack } from '../../hooks/useSafeBack';

const MAX_RATING = 5;
const FALLBACK_IMAGE = require('../../assets/images/Elden_Ring_capa.jpg');

function renderStars(rating: number): string {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(MAX_RATING - filled);
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
  const [lists, setLists] = useState<PublicUserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !username) return;
    setLoading(true);
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
      setLists(listsRes.lists);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, username, router]);

  useEffect(() => {
    load();
  }, [load]);

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
          <StatBox value={profile.followingCount} label="SEGUINDO" />
          <View style={styles.statDivider} />
          <StatBox value={profile.followersCount} label="SEGUIDORES" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTAS</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Ainda não avaliou nenhum jogo.</Text>
          ) : (
            <View style={styles.ratingChart}>
              {reviews.slice(0, 8).map((entry, index) => (
                <View
                  key={entry.id}
                  style={[styles.ratingRow, index === reviews.length - 1 && styles.ratingRowLast]}
                >
                  <Image
                    source={entry.game.cover ? { uri: entry.game.cover } : FALLBACK_IMAGE}
                    style={styles.ratingThumb}
                    contentFit="cover"
                  />
                  <View style={styles.ratingMeta}>
                    <Text style={styles.ratingName} numberOfLines={1}>
                      {entry.game.title}
                    </Text>
                    <Text style={styles.ratingStars}>{renderStars(entry.rating)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LISTAS PÚBLICAS</Text>
          {lists.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma lista pública ainda.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {lists.map((list) => (
                <View key={list.id} style={styles.listCard}>
                  <Text style={styles.listCardTitle} numberOfLines={2}>
                    {list.name}
                  </Text>
                  <Text style={styles.listCardCount}>{list.itemCount} jogos</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  ratingChart: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
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
  ratingThumb: {
    width: 32,
    height: 44,
    borderRadius: RADIUS.sm,
  },
  ratingMeta: {
    flex: 1,
  },
  ratingName: {
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.small,
  },
  ratingStars: {
    color: COLORS.nexoBlue,
    fontSize: 11,
    marginTop: 2,
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
