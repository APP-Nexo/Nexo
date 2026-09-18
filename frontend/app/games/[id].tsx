import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT } from '@/constants';
import FeaturedGame from '@/components/FeaturedGame';
import ActivityCard from '@/components/ActivityCard';
import PrimaryButton from '@/components/PrimaryButton';
import { getGameById, games } from '@/data/games';

const MOCK_DESCRIPTION =
  'Persona 5 Royal é a versão expandida e definitiva de Persona 5, o aclamado JRPG da Atlus. Você assume o papel de Joker, um estudante que após descobrir o poder de entrar no Palácio Metaverso — universo oculto abaixo da consciência humana — forma os Ladrões Fantasmas para mudar corações corrompidos. Com mecânicas de dungeon refinadas, novos personagens e um capítulo inédito, Royal é a experiência definitiva da série.';

const MOCK_STATS = [
  { value: '214K', label: 'AVALIAÇÕES' },
  { value: '4.9', label: 'NOTA MÉDIA' },
  { value: '8.7K', label: 'LIKES' },
  { value: '3.2K', label: 'JOGANDO' },
];

const MOCK_REVIEWS = [
  {
    id: '1',
    userInitials: 'KB',
    username: 'keizo_br',
    time: '2 dias atrás',
    action: 'avaliou',
    rating: 5,
    comment:
      'Melhor JRPG que já joguei. A história, a trilha sonora e as personagens são impecáveis. Persona 5 Royal elevou o padrão do gênero.',
  },
  {
    id: '2',
    userInitials: 'VX',
    username: 'voiix_br',
    time: '3 dias atrás',
    action: 'avaliou',
    rating: 5,
    comment:
      'A trilha sonora do Royal Meguro é outro nível. "Last Surprise" ficou na minha cabeça por semanas. Royal deixou o estilo ainda mais refinado.',
  },
  {
    id: '3',
    userInitials: 'NR',
    username: 'neonrider',
    time: '5 dias atrás',
    action: 'avaliou',
    rating: 4,
    comment:
      'Nunca fui fã do formato de dungeons mas esse jogo me fisgou. Entrei por uma hora e fui 3-4 horas direto sem perceber o tempo.',
  },
  {
    id: '4',
    userInitials: 'FH',
    username: 'fromherski',
    time: '1 semana atrás',
    action: 'avaliou',
    rating: 5,
    comment:
      'Comecei com ceticismo. Terminei Persona 5 Royal com a alma cheia d\'água. Acabou e eu ainda queria mais.',
  },
];

export default function GameDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [descExpanded, setDescExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const game = getGameById(id as string);
  const similarGames = games.filter((g) => g.id !== id).slice(0, 6);

  if (!game) {
    return <View style={styles.root} />;
  }

  const gameImageSource: ImageSourcePropType =
    typeof game.image === 'string'
      ? { uri: game.image }
      : (game.image as ImageSourcePropType);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
      >
        <FeaturedGame
          title={game.title}
          image={game.image}
          rating={game.rating}
          genres={game.genres}
          topInset={insets.top}
          onBackPress={() => router.back()}
          onFavoritePress={() => setIsFavorited((v) => !v)}
          isFavorited={isFavorited}
        />

        <View style={styles.content}>
          <PrimaryButton
            title="+ AVALIAR ESTE JOGO"
            onPress={() => router.push('/(tabs)/rate-game')}
          />

          <View style={styles.statsRow}>
            {MOCK_STATS.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index < MOCK_STATS.length - 1 && (
                  <View style={styles.statDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SOBRE O JOGO</Text>
              <Pressable onPress={() => setDescExpanded((v) => !v)}>
                <Text style={styles.sectionAction}>
                  {descExpanded ? 'MENOS' : 'LER MAIS'}
                </Text>
              </Pressable>
            </View>
            <Text
              style={styles.description}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {MOCK_DESCRIPTION}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>REVIEWS RECENTES</Text>
              <Pressable>
                <Text style={styles.sectionAction}>VER TODAS {'>'}</Text>
              </Pressable>
            </View>

            {MOCK_REVIEWS.map((review) => (
              <ActivityCard
                key={review.id}
                userInitials={review.userInitials}
                username={review.username}
                time={review.time}
                action={review.action}
                gameTitle={game.title}
                rating={review.rating}
                comment={review.comment}
                gameImage={gameImageSource}
              />
            ))}
          </View>

          {similarGames.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>JOGOS SIMILARES</Text>
                <Pressable>
                  <Text style={styles.sectionAction}>VER MAIS {'>'}</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: SPACING.sm }}
              >
                {similarGames.map((g) => (
                  <Pressable
                    key={g.id}
                    style={styles.similarCard}
                    onPress={() => router.push(`/games/${g.id}`)}
                  >
                    <Image
                      source={
                        typeof g.image === 'string'
                          ? { uri: g.image }
                          : g.image
                      }
                      style={styles.similarImage}
                      contentFit="cover"
                    />
                    <Text style={styles.similarTitle} numberOfLines={2}>
                      {g.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.lg,
    gap: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  statValue: {
    fontFamily: FONT.family.display,
    fontSize: FONT.subtitle,
    color: COLORS.nexoBlue,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xxs,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    color: COLORS.nexoBlue,
    letterSpacing: 2,
  },
  sectionAction: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  similarCard: {
    width: 92,
  },
  similarImage: {
    width: 92,
    height: 130,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  similarTitle: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.text,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
});
