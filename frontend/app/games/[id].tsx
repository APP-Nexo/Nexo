import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import GameHero from '@/components/FeaturedGame';
import { getGameById } from '@/data/games';

export default function GameDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const game = getGameById(id as string);

  if (!game) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <GameHero
        title={game.title}
        image={game.image}
        rating={game.rating}
        genres={game.genres}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
});