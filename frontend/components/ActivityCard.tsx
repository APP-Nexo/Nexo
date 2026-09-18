import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { COLORS, SPACING, FONT } from '@/constants';

interface ActivityCardProps {
  userInitials: string;
  username: string;
  time: string;
  action: string;
  gameTitle: string;
  rating: number;
  comment?: string;
  gameImage: ImageSourcePropType;
}

export default function ActivityCard({
  userInitials,
  username,
  time,
  action,
  gameTitle,
  rating,
  comment,
  gameImage,
}: ActivityCardProps) {
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.action}>
            {action} • {time}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Image source={gameImage} style={styles.gameImage} resizeMode="cover" />

        <View style={styles.bodyText}>
          <Text style={styles.gameTitle}>{gameTitle}</Text>
          {renderStars()}
          {comment ? <Text style={styles.comment}>"{comment}"</Text> : null}
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  stars: {
    color: COLORS.nexoBlue,
    marginBottom: SPACING.xs,
    fontSize: FONT.text,
  },
  comment: {
    color: COLORS.textMuted,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    lineHeight: 20,
  },
});
