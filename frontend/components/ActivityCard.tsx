import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, FONT, RADIUS } from '@/constants';
import type { UserGameStatus } from '@/services/library';
import GameCover from './GameCover';

const PROGRESS_LABELS: Partial<Record<UserGameStatus, string>> = {
  completed: 'ZEROU',
  playing: 'JOGANDO',
  abandoned: 'ABANDONOU',
  tried: 'EXPERIMENTOU',
};

interface ActivityCardProps {
  userInitials: string;
  username: string;
  time: string;
  action: string;
  gameTitle: string;
  rating: number;
  comment?: string;
  gameCover: string | null;
  progressStatus?: UserGameStatus | null;
  isOwn?: boolean;
  onPressUser?: () => void;
  onPressGame?: () => void;
}

export default function ActivityCard({
  userInitials,
  username,
  time,
  action,
  gameTitle,
  rating,
  comment,
  gameCover,
  progressStatus,
  isOwn = false,
  onPressUser,
  onPressGame,
}: ActivityCardProps) {
  const progressLabel = progressStatus ? PROGRESS_LABELS[progressStatus] : undefined;
  const renderStars = () => {
    const normalizedRating = Math.max(0, Math.min(5, rating));

    return (
      <Text style={styles.stars}>
        {'★'.repeat(normalizedRating)}
        {'☆'.repeat(5 - normalizedRating)}
      </Text>
    );
  };

  return (
    <View style={[styles.card, isOwn && styles.cardOwn]}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerUser}
          onPress={onPressUser}
          disabled={!onPressUser}
          hitSlop={4}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.action}>
              {action} • {time}
            </Text>
          </View>
        </Pressable>

        {isOwn && (
          <View style={styles.ownBadge}>
            <Text style={styles.ownBadgeText}>VOCÊ</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.body} onPress={onPressGame} disabled={!onPressGame}>
        <GameCover uri={gameCover} style={styles.gameImage} />

        <View style={styles.bodyText}>
          <Text style={styles.gameTitle} numberOfLines={2} ellipsizeMode="tail">
            {gameTitle}
          </Text>
          <View style={styles.metaRow}>
            {renderStars()}
            {progressLabel && (
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>{progressLabel}</Text>
              </View>
            )}
          </View>
          {comment ? <Text style={styles.comment}>"{comment}"</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardOwn: {
    borderColor: COLORS.nexoBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownBadge: {
    backgroundColor: COLORS.nexoBlue,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.round,
    marginLeft: SPACING.sm,
  },
  ownBadgeText: {
    color: COLORS.bodyBackground,
    fontFamily: FONT.family.bodyStrong,
    fontSize: FONT.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: SPACING.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
  },
  avatarText: {
    color: COLORS.nexoBlue,
    fontFamily: FONT.family.bodyStrong,
    fontSize: FONT.text,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  username: {
    color: COLORS.offWhite,
    fontFamily: FONT.family.bodyStrong,
    fontSize: FONT.subtitle,
    fontWeight: '700',
    marginBottom: 2,
  },
  action: {
    color: COLORS.textSecondary,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gameImage: {
    width: 72,
    height: 104,
    borderRadius: SPACING.md,
    marginRight: SPACING.md,
  },
  bodyText: {
    flex: 1,
  },
  gameTitle: {
    color: COLORS.offWhite,
    fontFamily: FONT.family.heading,
    fontSize: FONT.title,
    fontWeight: '900',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  stars: {
    color: COLORS.nexoBlue,
    fontSize: FONT.text,
  },
  progressPill: {
    backgroundColor: COLORS.surface3,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.round,
  },
  progressPillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT.family.bodyStrong,
    fontSize: FONT.micro,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  comment: {
    color: COLORS.textMuted,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    lineHeight: 20,
  },
});
