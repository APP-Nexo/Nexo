import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type GameHeroProps = {
  title: string;
  image: string | ImageSourcePropType;
  rating: number;
  genres?: string[];
  onFavoritePress?: () => void;
};

export default function GameHero({
  title,
  image,
  rating,
  genres = [],
  onFavoritePress,
}: GameHeroProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={typeof image === 'string' ? { uri: image } : image}
        style={styles.background}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.25)',
            'rgba(11,15,26,1)',
          ]}
          style={styles.overlay}
        />

        {/* TOPO */}
        <View style={styles.topContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              {title.slice(0, 2).toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.favoriteButton}
            onPress={onFavoritePress}
          >
            <Ionicons name="heart-outline" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.content}>
          <View style={styles.genreContainer}>
            {genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>★★★★★</Text>

            <Text style={styles.rating}>{rating}</Text>

            <Text style={styles.reviewText}> USER SCORES</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 430,
    backgroundColor: '#0B0F1A',
  },

  background: {
    flex: 1,
    justifyContent: 'space-between',
  },

  image: {
    resizeMode: 'cover',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topContainer: {
    paddingTop: 70,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },

  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  genreText: {
    color: '#DDD',
    fontSize: 10,
    fontWeight: '700',
  },

  title: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 40,
    textTransform: 'uppercase',
    marginBottom: 12,
    width: '80%',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stars: {
    color: '#FFD43B',
    fontSize: 12,
    marginRight: 6,
  },

  rating: {
    color: '#FFD43B',
    fontSize: 18,
    fontWeight: '800',
  },

  reviewText: {
    color: '#999',
    fontSize: 9,
    marginLeft: 4,
    fontWeight: '700',
  },
});