import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type ImageSourcePropType,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from '@/components/Carrousel';
import ActivityCard from '@/components/ActivityCard';
import { COLORS, SPACING, FONT } from '@/constants';
import { games } from '@/data/games';
import { useRouter } from 'expo-router';

const reviewers = [
  { id: 'u1', initials: 'LK', username: 'Lucas K.' },
  { id: 'u2', initials: 'RA', username: 'Raquel A.' },
  { id: 'u3', initials: 'MM', username: 'Mauro M.' },
];

const reviewGames = [
  {
    id: '1',
    gameId: '2',
    reviewerId: 'u1',
    comment: 'Poucos RPGs me prenderam tanto quanto este. Visual incrível e trilha sonora memorável.',
    time: '1h atrás',
  },
  {
    id: '2',
    gameId: '3',
    reviewerId: 'u2',
    comment: 'Combate rápido e viciante, perfeito para partidas curtas e longas.',
    time: '2h atrás',
  },
  {
    id: '3',
    gameId: '1',
    reviewerId: 'u3',
    comment: 'O, Death. Become my blade, once more.',
    time: 'agora',
  },
];

const activities = reviewGames
  .map((review, index) => {
    const game = games.find((item) => item.id === review.gameId);
    const reviewer = reviewers.find((user) => user.id === review.reviewerId);
    if (!game) return null;

    return {
      id: `a${index + 1}`,
      userInitials: reviewer?.initials ?? 'EU',
      username: reviewer?.username ?? 'Você',
      time: review.time,
      action: 'avaliou',
      gameTitle: game.title,
      rating: game.rating,
      comment: review.comment,
      gameImage: game.image as ImageSourcePropType,
    };
  })
  .filter(Boolean) as Array<{
    id: string;
    userInitials: string;
    username: string;
    time: string;
    action: string;
    gameTitle: string;
    rating: number;
    comment: string;
    gameImage: ImageSourcePropType;
  }>;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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
            <View style={styles.profileIcon}>
              <Text style={styles.profileText}>KZ</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR JOGOS..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EM ALTA</Text>
          <Text style={styles.sectionLink}>VER TODOS</Text>
        </View>

        <Carousel
          data={games}
          style={{ marginBottom: 30 }}
          onPressItem={(game) => router.push(`/games/${game.id}`)}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ATIVIDADES RECENTES</Text>
          <Text style={styles.sectionLink}>VER TODAS</Text>
        </View>

        <View style={styles.activitiesList}>
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              userInitials={activity.userInitials}
              username={activity.username}
              time={activity.time}
              action={activity.action}
              gameTitle={activity.gameTitle}
              rating={activity.rating}
              comment={activity.comment}
              gameImage={activity.gameImage}
            />
          ))}
        </View>
      </ScrollView>
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
  activitiesList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
});