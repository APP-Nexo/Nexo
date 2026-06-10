import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import { games } from '../../data/games';
import {
  MOCK_USER,
  MOCK_LISTS,
  type FavoriteGame,
  type RatingEntry,
  type ActivityEntry,
  type LogEntry,
  type GameList,
} from '../../data/profileMocks';

type ListTab = 'todas' | 'listas';

const MAX_RATING = 5;
const LOG_COLUMNS = 3;

const favoriteGames: FavoriteGame[] = games.slice(0, 4).map((game) => ({
  id: game.id,
  title: game.title,
  image: game.image,
  rating: game.rating,
}));

const ratingEntries: RatingEntry[] = games.slice(0, 5).map((game) => ({
  id: game.id,
  title: game.title,
  rating: game.rating,
}));

const activityItems: ActivityEntry[] = [
  {
    id: '1',
    gameTitle: games.find((game) => game.id === '1')?.title ?? 'ELDEN RING',
    actionType: 'review',
    actionLabel: 'review publicada',
    date: '2 dias atrás',
    rating: games.find((game) => game.id === '1')?.rating ?? 5,
    image: games.find((game) => game.id === '1')?.image ?? games[0].image,
  },
  {
    id: '2',
    gameTitle: games.find((game) => game.id === '3')?.title ?? 'HADES II',
    actionType: 'rating',
    actionLabel: 'nota atualizada',
    date: '4 dias atrás',
    rating: games.find((game) => game.id === '3')?.rating ?? 4,
    image: games.find((game) => game.id === '3')?.image ?? games[0].image,
  },
  {
    id: '3',
    gameTitle: games.find((game) => game.id === '6')?.title ?? 'THE LAST OF US 2',
    actionType: 'favorite',
    actionLabel: 'adicionado aos favoritos',
    date: '1 semana atrás',
    rating: games.find((game) => game.id === '6')?.rating ?? 5,
    image: games.find((game) => game.id === '6')?.image ?? games[0].image,
  },
];

const logEntries: LogEntry[] = games.map((game) => ({
  id: game.id,
  title: game.title,
  image: game.image,
  rating: game.rating,
}));

function renderStars(rating: number): string {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(MAX_RATING - filled);
}

function activityAccentColor(actionType: ActivityEntry['actionType']): string {
  return actionType === 'favorite' ? COLORS.nexoPink : COLORS.nexoBlue;
}

function ratingBarColor(index: number): string {
  return index % 2 === 0 ? COLORS.nexoBlue : COLORS.nexoPink;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ListTab>('todas');

  const logItemWidth =
    (screenWidth - SPACING.lg * 2 - SPACING.xs * (LOG_COLUMNS - 1)) /
    LOG_COLUMNS;

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
              <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{MOCK_USER.username}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{MOCK_USER.level}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{MOCK_USER.status}</Text>
              </View>
            </View>

            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>EDITAR</Text>
            </Pressable>
          </View>

          <Text style={styles.bio}>{MOCK_USER.bio}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={MOCK_USER.stats.games} label="JOGOS" />
          <View style={styles.statDivider} />
          <StatBox value={MOCK_USER.stats.reviews} label="REVIEWS" />
          <View style={styles.statDivider} />
          <StatBox value={MOCK_USER.stats.following} label="SEGUINDO" />
          <View style={styles.statDivider} />
          <StatBox value={MOCK_USER.stats.followers} label="SEGUIDORES" />
        </View>

        <View style={styles.section}>
          <SectionHeader title="JOGOS FAVORITOS" action="VER TODOS" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {favoriteGames.map((game) => (
              <FavoriteCard key={game.id} game={game} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="SUAS NOTAS" action="VER MAIS" />
          <View style={styles.ratingChart}>
            {ratingEntries.map((entry, index) => (
              <RatingRow
                key={entry.id}
                entry={entry}
                barColor={ratingBarColor(index)}
                isLast={index === ratingEntries.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="ATIVIDADE RECENTE" action="VER TUDO" />
          {activityItems.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="LOG DE JOGOS" action="VER TODOS" />
          <View style={styles.logGrid}>
            {logEntries.map((game) => (
              <LogCard key={game.id} game={game} itemWidth={logItemWidth} />
            ))}
          </View>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {MOCK_LISTS.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </ScrollView>
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

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Text style={styles.sectionAction}>{action} &gt;</Text>}
    </View>
  );
}

function FavoriteCard({ game }: { game: FavoriteGame }) {
  return (
    <View style={styles.favoriteCard}>
      <Image source={game.image} style={styles.favoritePoster} contentFit="cover" />
      <Text style={styles.favoriteTitle} numberOfLines={2}>
        {game.title}
      </Text>
      <Text style={styles.favoriteStars}>{renderStars(game.rating)}</Text>
    </View>
  );
}

function RatingRow({
  entry,
  barColor,
  isLast,
}: {
  entry: RatingEntry;
  barColor: string;
  isLast: boolean;
}) {
  const fillPercent = `${((entry.rating / MAX_RATING) * 100).toFixed(0)}%` as `${number}%`;

  return (
    <View style={[styles.ratingRow, isLast && styles.ratingRowLast]}>
      <View style={styles.ratingMeta}>
        <Text style={styles.ratingStars}>{renderStars(entry.rating)}</Text>
        <Text style={styles.ratingName} numberOfLines={1}>
          {entry.title}
        </Text>
      </View>
      <View style={styles.ratingBarTrack}>
        <View
          style={[styles.ratingBarFill, { width: fillPercent, backgroundColor: barColor }]}
        />
      </View>
      <Text style={[styles.ratingValue, { color: barColor }]}>
        {entry.rating.toFixed(1)}
      </Text>
    </View>
  );
}

function ActivityItem({ item }: { item: ActivityEntry }) {
  const accentColor = activityAccentColor(item.actionType);

  return (
    <View style={styles.activityCard}>
      <View style={[styles.activityAccent, { backgroundColor: accentColor }]} />
      <Image source={item.image} style={styles.activityThumb} contentFit="cover" />
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.gameTitle}</Text>
        <Text style={[styles.activityStars, { color: accentColor }]}>
          {renderStars(item.rating)}
        </Text>
        <Text style={styles.activityAction}>{item.actionLabel}</Text>
        <Text style={styles.activityMeta}>
          {MOCK_USER.username} • {item.date}
        </Text>
      </View>
    </View>
  );
}

function LogCard({ game, itemWidth }: { game: LogEntry; itemWidth: number }) {
  return (
    <View style={{ width: itemWidth }}>
      <Image
        source={game.image}
        style={[styles.logPoster, { width: itemWidth }]}
        contentFit="cover"
      />
      <Text style={styles.logTitle} numberOfLines={2}>
        {game.title}
      </Text>
      <Text style={styles.logStars}>{renderStars(game.rating)}</Text>
    </View>
  );
}

function ListCard({ list }: { list: GameList }) {
  return (
    <View style={styles.listCard}>
      <Text style={styles.listCardTitle} numberOfLines={2}>
        {list.title}
      </Text>
      <Text style={styles.listCardCount}>{list.count} jogos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  username: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.subtitle,
    letterSpacing: 1,
  },
  levelBadge: {
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  levelText: {
    fontFamily: FONT.family.body,
    color: COLORS.nexoBlue,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.statusGreen,
  },
  statusText: {
    fontFamily: FONT.family.body,
    color: COLORS.statusGreen,
    fontSize: FONT.caption,
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
  sectionAction: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    letterSpacing: 0.5,
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
