import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from '@/components/Carrousel';
import ActivityCard from '@/components/ActivityCard';
import { COLORS, SPACING, FONT } from '@/constants';
import type { Game } from '@/types/Game';
import eldenring from '../../assets/images/Elden_Ring_capa.jpg';

const games: Game[] = [
  {
    id: '1',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
    isNew: true,
  },
  {
    id: '2',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
  },
  {
    id: '3',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
  },
];

const activities = [
  {
    id: 'a1',
    userInitials: 'LK',
    username: 'Lucas K.',
    time: '5m atrás',
    action: 'avaliou',
    gameTitle: 'ELDEN RING II',
    rating: 5,
    comment: 'Melhor sequência de todos os tempos!',
    gameImage: eldenring,
  },
  {
    id: 'a2',
    userInitials: 'RA',
    username: 'Raquel A.',
    time: '20m atrás',
    action: 'completou',
    gameTitle: 'ELDEN RING II',
    rating: 4,
    comment: 'História e jogabilidade incríveis.',
    gameImage: eldenring,
  },
  {
    id: 'a3',
    userInitials: 'MM',
    username: 'Mauro M.',
    time: '1h atrás',
    action: 'favoritou',
    gameTitle: 'ELDEN RING II',
    rating: 2,
    gameImage: eldenring,
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Logo NEXO com gradiente */}
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
            {/* Fim do logo NEXO */}
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