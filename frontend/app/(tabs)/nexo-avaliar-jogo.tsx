import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SPACING, FONT } from '../../constants';
import { games } from '../../data/games';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function GamesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jogos</Text>

      <TextInput
        placeholder="Buscar jogo..."
        placeholderTextColor="#6B7280"
        style={styles.input}
      />

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              <Image
                source={item.image}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />

              <View style={styles.badge}>
                <Text style={styles.badgeText}>A1</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text
                style={styles.cardTitle}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text style={styles.genre}>{item.category}</Text>
              <Text style={styles.genre} numberOfLines={1}>
                {item.genres?.slice(0, 2).join(' • ')}
              </Text>

              <Text style={styles.stars}>{item.rating.toFixed(1)} ★</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,     
    paddingHorizontal: 16,
    paddingTop: 60,
  },

  title: {
    color: '#FFFFFF',
    fontFamily: FONT.family.heading,
    fontSize: FONT.heading,
    fontWeight: '700',
    marginBottom: 16,
  },

  input: {
    height: 48,
    backgroundColor: '#0E1621',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1F2A37',
  },

  card: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },

  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontFamily: FONT.family.heading,
    fontSize: 16,
    fontWeight: '600',
  },

  genre: {
    color: '#6B7280',
    fontFamily: FONT.family.heading,
    fontSize: 11,
    marginTop: 4,
  },

  stars: {
    color: '#00E0FF',
    fontFamily: FONT.family.heading,
    marginTop: 6,
    fontSize: 12,
  },

  imageContainer: {
  position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00E0FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },

  infoContainer: {
    backgroundColor: '#0E1621',
    padding: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 100,
    justifyContent: 'space-around',
  },

});