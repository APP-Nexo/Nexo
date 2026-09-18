import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { meApi, type MeResponse } from '../../services/me';
import { usersApi, type PublicUserReview, type UserStatsDTO } from '../../services/users';
import { libraryApi, type LibraryGameDTO, type LibraryListDTO } from '../../services/library';

type ListTab = 'todas' | 'listas';

const MAX_RATING = 5;
const LOG_COLUMNS = 3;
const FALLBACK_IMAGE = require('../../assets/images/Elden_Ring_capa.jpg');

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
  const { width: screenWidth } = useWindowDimensions();
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ListTab>('todas');

  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [favorites, setFavorites] = useState<LibraryGameDTO[]>([]);
  const [reviews, setReviews] = useState<PublicUserReview[]>([]);
  const [lists, setLists] = useState<LibraryListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const logItemWidth =
    (screenWidth - SPACING.lg * 2 - SPACING.xs * (LOG_COLUMNS - 1)) / LOG_COLUMNS;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
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
      setReviews(reviewsResponse.reviews);
      setLists(listsResponse.lists);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
        <Pressable onPress={logout} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: COLORS.textSecondary, fontFamily: FONT.family.display }}>SAIR DA CONTA</Text>
        </Pressable>
      </View>
    );
  }

  const initials = me.username.slice(0, 2).toUpperCase();
  const ratingsSorted = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 8);

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
                <Image source={{ uri: me.profile.photo }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username}>{me.username}</Text>
            </View>

            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>EDITAR</Text>
            </Pressable>
          </View>

          {me.profile?.bio ? <Text style={styles.bio}>{me.profile.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats?.totalGames ?? 0} label="JOGOS" />
          <View style={styles.statDivider} />
          <StatBox value={stats?.totalReviews ?? 0} label="REVIEWS" />
          <View style={styles.statDivider} />
          <StatBox value={stats?.followingCount ?? 0} label="SEGUINDO" />
          <View style={styles.statDivider} />
          <StatBox value={stats?.followersCount ?? 0} label="SEGUIDORES" />
        </View>

        <View style={styles.section}>
          <SectionHeader title="JOGOS FAVORITOS" />
          {favorites.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não favoritou nenhum jogo.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {favorites.map((entry) => (
                <FavoriteCard key={entry.id} entry={entry} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="SUAS NOTAS" />
          {ratingsSorted.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não avaliou nenhum jogo.</Text>
          ) : (
            <View style={styles.ratingChart}>
              {ratingsSorted.map((entry, index) => (
                <RatingRow
                  key={entry.id}
                  entry={entry}
                  barColor={ratingBarColor(index)}
                  isLast={index === ratingsSorted.length - 1}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="ATIVIDADE RECENTE" />
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
          ) : (
            reviews.slice(0, 6).map((entry) => (
              <ActivityItem key={entry.id} entry={entry} username={me.username} />
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="LOG DE JOGOS" />
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum jogo no seu log ainda.</Text>
          ) : (
            <View style={styles.logGrid}>
              {reviews.map((entry) => (
                <LogCard key={entry.id} entry={entry} itemWidth={logItemWidth} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.listsHeaderRow}>
            <Text style={styles.sectionTitle}>LISTAS</Text>
            <View style={styles.listsTabs}>
              <Pressable
                style={[styles.listTab, activeTab === 'todas' && styles.listTabActive]}
                onPress={() => setActiveTab('todas')}
              >
                <Text
                  style={[
                    styles.listTabText,
                    activeTab === 'todas' && styles.listTabTextActive,
                  ]}
                >
                  TODAS
                </Text>
              </Pressable>
              <Pressable
                style={[styles.listTab, activeTab === 'listas' && styles.listTabActive]}
                onPress={() => setActiveTab('listas')}
              >
                <Text
                  style={[
                    styles.listTabText,
                    activeTab === 'listas' && styles.listTabTextActive,
                  ]}
                >
                  LISTAS
                </Text>
              </Pressable>
            </View>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FavoriteCard({ entry }: { entry: LibraryGameDTO }) {
  return (
    <View style={styles.favoriteCard}>
      <Image
        source={entry.game.cover ? { uri: entry.game.cover } : FALLBACK_IMAGE}
        style={styles.favoritePoster}
        contentFit="cover"
      />
      <Text style={styles.favoriteTitle} numberOfLines={2}>
        {entry.game.title}
      </Text>
      <Text style={styles.favoriteStars}>{renderStars(entry.game.averageRating)}</Text>
    </View>
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

  return (
    <View style={[styles.ratingRow, isLast && styles.ratingRowLast]}>
      <View style={styles.ratingMeta}>
        <Text style={styles.ratingStars}>{renderStars(entry.rating)}</Text>
        <Text style={styles.ratingName} numberOfLines={1}>
          {entry.game.title}
        </Text>
      </View>
      <View style={styles.ratingBarTrack}>
        <View
          style={[styles.ratingBarFill, { width: fillPercent, backgroundColor: barColor }]}
        />
      </View>
      <Text style={[styles.ratingValue, { color: barColor }]}>{entry.rating.toFixed(1)}</Text>
    </View>
  );
}

function ActivityItem({ entry, username }: { entry: PublicUserReview; username: string }) {
  return (
    <View style={styles.activityCard}>
      <View style={[styles.activityAccent, { backgroundColor: COLORS.nexoBlue }]} />
      <Image
        source={entry.game.cover ? { uri: entry.game.cover } : FALLBACK_IMAGE}
        style={styles.activityThumb}
        contentFit="cover"
      />
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{entry.game.title}</Text>
        <Text style={[styles.activityStars, { color: COLORS.nexoBlue }]}>
          {renderStars(entry.rating)}
        </Text>
        <Text style={styles.activityAction}>review publicada</Text>
        <Text style={styles.activityMeta}>
          {username} • {timeAgo(entry.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function LogCard({ entry, itemWidth }: { entry: PublicUserReview; itemWidth: number }) {
  return (
    <View style={{ width: itemWidth }}>
      <Image
        source={entry.game.cover ? { uri: entry.game.cover } : FALLBACK_IMAGE}
        style={[styles.logPoster, { width: itemWidth }]}
        contentFit="cover"
      />
      <Text style={styles.logTitle} numberOfLines={2}>
        {entry.game.title}
      </Text>
      <Text style={styles.logStars}>{renderStars(entry.rating)}</Text>
    </View>
  );
}

function ListCard({ list }: { list: LibraryListDTO }) {
  return (
    <View style={styles.listCard}>
      <Text style={styles.listCardTitle} numberOfLines={2}>
        {list.name}
      </Text>
      <Text style={styles.listCardCount}>{list.itemCount} jogos</Text>
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
  },
  username: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.subtitle,
    letterSpacing: 1,
  },
  editButton: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  editButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
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

  logGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  logPoster: {
    height: 120,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxs,
  },
  logTitle: {
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.caption,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  logStars: {
    color: COLORS.nexoBlue,
    fontSize: 9,
    marginTop: 1,
  },

  listsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listsTabs: {
    flexDirection: 'row',
    gap: SPACING.xxs,
  },
  listTab: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listTabActive: {
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.surface2,
  },
  listTabText: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  listTabTextActive: {
    color: COLORS.nexoBlue,
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
