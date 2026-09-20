import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { meApi } from '../../services/me';
import { socialApi, type SocialUser } from '../../services/social';
import { ApiError } from '../../services/api';
import { useSafeBack } from '../../hooks/useSafeBack';

type ListType = 'followers' | 'following';

export default function SocialListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useSafeBack();
  const { username, type: typeParam } = useLocalSearchParams<{ username: string; type?: string }>();
  const type: ListType = typeParam === 'following' ? 'following' : 'followers';
  const { token } = useAuth();
  const { showError } = useToast();

  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [followSavingId, setFollowSavingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const hasLoadedOnce = useRef(false);
  const isOwnFollowersList = type === 'followers' && myUsername !== null && myUsername === username;

  const fetchPage = useCallback(
    (pageCursor?: number) =>
      type === 'followers'
        ? socialApi.followers(token!, username, pageCursor)
        : socialApi.following(token!, username, pageCursor),
    [type, token, username],
  );

  const load = useCallback(async () => {
    if (!token || !username) return;
    // Only show the full-screen spinner on the very first load of a given
    // list; a refocus or a tab switch refreshes quietly.
    if (!hasLoadedOnce.current) setLoading(true);
    setError(false);
    try {
      const [me, page] = await Promise.all([meApi.get(token).catch(() => null), fetchPage()]);
      if (me) setMyUsername(me.username);
      setUsers('followers' in page ? page.followers : page.following);
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [token, username, fetchPage]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function loadMore() {
    if (!token || cursor === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      const nextUsers = 'followers' in page ? page.followers : page.following;
      setUsers((prev) => [...prev, ...nextUsers]);
      setCursor(page.nextCursor);
    } catch {
      // best-effort; onEndReached will simply fire again on next scroll
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleFollow(entry: SocialUser) {
    if (!token || followSavingId !== null) return;
    const next = !entry.isFollowing;
    setUsers((prev) => prev.map((u) => (u.id === entry.id ? { ...u, isFollowing: next } : u)));
    setFollowSavingId(entry.id);
    try {
      if (next) {
        await socialApi.follow(token, entry.username);
      } else {
        await socialApi.unfollow(token, entry.username);
      }
    } catch (error) {
      setUsers((prev) => prev.map((u) => (u.id === entry.id ? { ...u, isFollowing: !next } : u)));
      showError(error instanceof ApiError ? error.message : 'Não foi possível atualizar o follow.');
    } finally {
      setFollowSavingId(null);
    }
  }

  async function removeFollower(entry: SocialUser) {
    if (!token || removingId !== null) return;
    setRemovingId(entry.id);
    const previous = users;
    setUsers((prev) => prev.filter((u) => u.id !== entry.id));
    try {
      await socialApi.removeFollower(token, entry.username);
    } catch (error) {
      setUsers(previous);
      showError(error instanceof ApiError ? error.message : 'Não foi possível remover este seguidor.');
    } finally {
      setRemovingId(null);
    }
  }

  function goToProfile(targetUsername: string) {
    if (myUsername && targetUsername === myUsername) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/user/${targetUsername}`);
    }
  }

  function switchTab(nextType: ListType) {
    if (nextType === type) return;
    router.setParams({ type: nextType });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.topBarUsername} numberOfLines={1} ellipsizeMode="tail">
          @{username}
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => switchTab('followers')}>
          <Text style={[styles.tabText, type === 'followers' && styles.tabTextActive]}>SEGUIDORES</Text>
          {type === 'followers' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tab} onPress={() => switchTab('following')}>
          <Text style={[styles.tabText, type === 'following' && styles.tabTextActive]}>SEGUINDO</Text>
          {type === 'following' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.nexoBlue} />
        </View>
      ) : error ? (
        <View style={[styles.centered, { paddingHorizontal: SPACING.lg }]}>
          <ErrorState message="Não foi possível carregar esta lista." onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {type === 'followers' ? 'Ninguém está seguindo ainda.' : 'Não está seguindo ninguém ainda.'}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={COLORS.nexoBlue} style={styles.footerSpinner} />
            ) : null
          }
          renderItem={({ item }) => {
            const isSelf = myUsername === item.username;
            const initials = item.username.slice(0, 2).toUpperCase();
            return (
              <Pressable style={styles.row} onPress={() => goToProfile(item.username)}>
                <View style={styles.avatar}>
                  {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
                <Text style={styles.rowUsername} numberOfLines={1} ellipsizeMode="tail">
                  {item.username}
                </Text>
                {!isSelf && (
                  <Pressable
                    style={[styles.followButton, item.isFollowing && styles.followButtonActive]}
                    onPress={() => toggleFollow(item)}
                    disabled={followSavingId === item.id}
                    hitSlop={8}
                  >
                    <Text
                      style={[styles.followButtonText, item.isFollowing && styles.followButtonTextActive]}
                    >
                      {item.isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                    </Text>
                  </Pressable>
                )}
                {isOwnFollowersList && !isSelf && (
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeFollower(item)}
                    disabled={removingId === item.id}
                    hitSlop={8}
                  >
                    {removingId === item.id ? (
                      <ActivityIndicator color={COLORS.nexoPink} size="small" />
                    ) : (
                      <Text style={styles.removeButtonText}>REMOVER</Text>
                    )}
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
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
  backIcon: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -2,
  },
  topBarUsername: {
    flex: 1,
    fontFamily: FONT.family.display,
    color: COLORS.textSecondary,
    fontSize: FONT.text,
    letterSpacing: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  tabText: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.nexoBlue,
  },
  tabIndicator: {
    marginTop: SPACING.xs,
    height: 2,
    width: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.nexoBlue,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  emptyText: {
    fontFamily: FONT.family.body,
    color: COLORS.textMuted,
    fontSize: FONT.small,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  footerSpinner: {
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.small,
    letterSpacing: 0.5,
  },
  rowUsername: {
    flex: 1,
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.text,
    letterSpacing: 0.5,
  },
  followButton: {
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  followButtonActive: {
    backgroundColor: COLORS.surface3,
    borderColor: COLORS.borderLight,
  },
  followButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 0.5,
  },
  followButtonTextActive: {
    color: COLORS.textSecondary,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: COLORS.nexoPink,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minWidth: 72,
    alignItems: 'center',
  },
  removeButtonText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.caption,
    letterSpacing: 0.5,
  },
});
