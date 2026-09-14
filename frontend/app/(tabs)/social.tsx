import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '@/components/logo';
import { COLORS, FONT, RADIUS, SPACING } from '@/constants';
import { MOCK_USER } from '@/data/profileMocks';
import {
  SOCIAL_FOLLOWERS,
  SOCIAL_FOLLOWING,
  SOCIAL_SUGGESTIONS,
  type SocialUser,
} from '@/data/socialMocks';

type SocialTab = 'following' | 'followers';

const INITIAL_FOLLOWING_IDS = new Set(
  [...SOCIAL_FOLLOWING, ...SOCIAL_FOLLOWERS, ...SOCIAL_SUGGESTIONS]
    .filter((user) => user.isFollowing)
    .map((user) => user.id)
);

function matchesSearch(user: SocialUser, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  return [user.username, user.name].some((value) =>
    value.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
  );
}

if (__DEV__) {
  console.assert(matchesSearch(SOCIAL_FOLLOWING[0], 'VITOR'));
}

function Avatar({ user, size }: { user: SocialUser; size: number }) {
  return (
    <View>
      <LinearGradient
        colors={user.gradient}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 3 }]}
      >
        <Text style={styles.avatarText}>{user.initials}</Text>
      </LinearGradient>
      {user.online && <View style={styles.onlineDot} />}
    </View>
  );
}

function FollowButton({
  following,
  onPress,
}: {
  following: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.followButton, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={following ? 'Deixar de seguir' : 'Seguir usuário'}
    >
      <Text style={styles.followButtonText}>{following ? 'SEGUINDO' : '+ SEGUIR'}</Text>
    </Pressable>
  );
}

function SuggestedUserCard({
  user,
  width,
  following,
  onToggleFollow,
}: {
  user: SocialUser;
  width: number;
  following: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <View style={[styles.suggestionCard, { width }]}>
      <Avatar user={user} size={54} />
      <Text style={styles.suggestionUsername} numberOfLines={1}>
        {user.username}
      </Text>
      <Text style={styles.suggestionMeta}>
        {user.mutualCount} {user.mutualCount === 1 ? 'mútuo' : 'mútuos'}
      </Text>
      <Text style={styles.suggestionCount}>{user.gamesCount}</Text>
      <Text style={styles.suggestionMeta}>JOGOS</Text>
      <FollowButton following={following} onPress={onToggleFollow} />
    </View>
  );
}

function SocialUserRow({
  user,
  following,
  onToggleFollow,
}: {
  user: SocialUser;
  following: boolean;
  onToggleFollow: () => void;
}) {
  const filledStars = Math.max(0, Math.min(5, Math.round(user.rating)));

  return (
    <View style={styles.userRow}>
      <Avatar user={user} size={44} />

      <View style={styles.userContent}>
        <View style={styles.usernameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {user.username}
          </Text>
          {user.mutualCount > 0 && (
            <View style={styles.mutualBadge}>
              <Text style={styles.mutualBadgeText}>MÚTUO</Text>
            </View>
          )}
        </View>
        <Text style={styles.libraryText}>{user.gamesCount} jogos na biblioteca</Text>
        <View style={styles.activityRow}>
          <View style={styles.gameBadge}>
            <Text style={styles.gameBadgeText} numberOfLines={1}>
              {user.currentGame}
            </Text>
          </View>
          <Text style={styles.stars}>
            {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
          </Text>
          <View style={styles.activityDot} />
          <Text style={styles.activityTime}>{user.lastActivity}</Text>
        </View>
      </View>

      <FollowButton following={following} onPress={onToggleFollow} />
    </View>
  );
}

function SocialTabs({
  activeTab,
  onChange,
}: {
  activeTab: SocialTab;
  onChange: (tab: SocialTab) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(['following', 'followers'] as const).map((tab) => {
        const active = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab === 'following' ? 'SEGUINDO' : 'SEGUIDORES'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: SocialTab }>();
  const [query, setQuery] = useState('');
  const [suggestionPage, setSuggestionPage] = useState(0);
  const [followingIds, setFollowingIds] = useState(() => new Set(INITIAL_FOLLOWING_IDS));

  const activeTab: SocialTab = tab === 'followers' ? 'followers' : 'following';
  const users = activeTab === 'following' ? SOCIAL_FOLLOWING : SOCIAL_FOLLOWERS;
  const filteredUsers = users.filter((user) => matchesSearch(user, query));
  const suggestionWidth = Math.max(
    104,
    (width - SPACING.lg * 2 - SPACING.sm * 2) / 3
  );

  function toggleFollow(id: string) {
    setFollowingIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changeTab(nextTab: SocialTab) {
    setQuery('');
    router.setParams({ tab: nextTab });
  }

  const header = (
    <>
      <View style={styles.header}>
        <Logo size={26} width={96} subtitle={false} />
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => Alert.alert('Notificações', 'Nenhuma notificação nova.')}
            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
          >
            <Ionicons name="notifications" size={17} color={COLORS.nexoGold} />
          </Pressable>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>{MOCK_USER.initials}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={COLORS.nexoBlue} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholder="Buscar pessoas..."
          placeholderTextColor={COLORS.placeholder}
          selectionColor={COLORS.nexoBlue}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar pessoas"
        />
      </View>

      <SocialTabs activeTab={activeTab} onChange={changeTab} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SUGESTÕES PARA VOCÊ</Text>
        <Pressable accessibilityRole="button">
          <Text style={styles.sectionAction}>VER MAIS →</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={SOCIAL_SUGGESTIONS}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => (
          <SuggestedUserCard
            user={item}
            width={suggestionWidth}
            following={followingIds.has(item.id)}
            onToggleFollow={() => toggleFollow(item.id)}
          />
        )}
        contentContainerStyle={styles.suggestionsList}
        showsHorizontalScrollIndicator={false}
        snapToInterval={suggestionWidth + SPACING.sm}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) =>
          setSuggestionPage(
            Math.min(
              2,
              Math.round(
                event.nativeEvent.contentOffset.x / (suggestionWidth + SPACING.sm)
              )
            )
          )
        }
      />

      <View style={styles.pagination}>
        {[0, 1, 2].map((page) => (
          <View
            key={page}
            style={[
              styles.paginationDot,
              suggestionPage === page && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'following' ? 'QUEM VOCÊ SEGUE' : 'SEUS SEGUIDORES'}
        </Text>
        <Text style={styles.peopleCount}>{users.length} pessoas</Text>
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />
      <FlatList
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => (
          <SocialUserRow
            user={item}
            following={followingIds.has(item.id)}
            onToggleFollow={() => toggleFollow(item.id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.emptyText}>NENHUMA PESSOA ENCONTRADA</Text>}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
  },
  profileBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.nexoBlue,
  },
  profileBadgeText: {
    fontFamily: FONT.family.display,
    color: COLORS.bodyBackground,
    fontSize: FONT.caption,
  },
  searchBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: FONT.family.body,
    color: COLORS.text,
    fontSize: FONT.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.nexoBlue,
  },
  tabText: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.nexoBlue,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
  sectionAction: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.micro,
  },
  suggestionsList: {
    gap: SPACING.sm,
  },
  suggestionCard: {
    minHeight: 164,
    alignItems: 'center',
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONT.family.display,
    color: COLORS.bodyBackground,
    fontSize: FONT.small,
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.bodyBackground,
    backgroundColor: COLORS.statusGreen,
  },
  suggestionUsername: {
    width: '100%',
    marginTop: SPACING.xs,
    fontFamily: FONT.family.bodyStrong,
    color: COLORS.text,
    fontSize: FONT.caption,
    textAlign: 'center',
  },
  suggestionMeta: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
  },
  suggestionCount: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
  },
  followButton: {
    minWidth: 66,
    height: 24,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  followButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: 8,
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.65,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    paddingVertical: SPACING.xs,
  },
  paginationDot: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.textMuted,
  },
  paginationDotActive: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.nexoBlue,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  peopleCount: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
  },
  userRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface2,
  },
  userContent: {
    flex: 1,
    minWidth: 0,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  username: {
    flexShrink: 1,
    fontFamily: FONT.family.bodyStrong,
    color: COLORS.text,
    fontSize: FONT.small,
  },
  mutualBadge: {
    paddingHorizontal: SPACING.xxs,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.nexoGold,
  },
  mutualBadgeText: {
    fontFamily: FONT.family.display,
    color: COLORS.bodyBackground,
    fontSize: 7,
  },
  libraryText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  gameBadge: {
    maxWidth: 92,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface3,
  },
  gameBadgeText: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: 8,
  },
  stars: {
    color: COLORS.nexoGold,
    fontSize: 8,
  },
  activityDot: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.nexoBlue,
  },
  activityTime: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: 8,
  },
  emptyText: {
    paddingVertical: SPACING.xxl,
    textAlign: 'center',
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 1,
  },
});
