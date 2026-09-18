import { useMemo } from 'react';
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
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

const ACTIVE_OPACITY = 0.8;
const HERO_HEIGHT = 430;
const TOP_BAR_TOP_OFFSET = 12;
const LOGO_INITIALS_LENGTH = 2;
const DEFAULT_TOP_INSET = 60;

const HERO_BG = '#0B0F1A';
const STAR_COLOR = '#FFD43B';
const COLOR_TEXT_PRIMARY = '#FFFFFF';
const COLOR_TEXT_GENRE = '#DDDDDD';
const COLOR_TEXT_REVIEW = '#999999';
const COLOR_OVERLAY_BACK_BTN = 'rgba(0,0,0,0.45)';
const COLOR_OVERLAY_FAV_BTN = 'rgba(0,0,0,0.35)';
const COLOR_LOGO_BG = 'rgba(255,255,255,0.12)';
const COLOR_GENRE_BG = 'rgba(255,255,255,0.14)';

const GRADIENT_COLORS = [
  'rgba(0,0,0,0)',
  'rgba(0,0,0,0.25)',
  'rgba(11,15,26,1)',
] as const;

type FeaturedGameProps = Readonly<{
  title: string;
  image: string | ImageSourcePropType;
  rating: number;
  genres?: string[];
  onFavoritePress?: () => void;
  onBackPress?: () => void;
  isFavorited?: boolean;
  topInset?: number;
}>;

type HeroTopBarProps = Readonly<{
  topInset: number;
  initials: string;
  isFavorited: boolean;
  onBackPress?: () => void;
  onFavoritePress?: () => void;
}>;

function HeroTopBar({
  topInset,
  initials,
  isFavorited,
  onBackPress,
  onFavoritePress,
}: HeroTopBarProps) {
  const containerStyle = useMemo(
    () => [styles.topContainer, { paddingTop: topInset + TOP_BAR_TOP_OFFSET }],
    [topInset]
  );

  return (
    <View style={containerStyle}>
      {onBackPress ? (
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons name="chevron-back" size={20} color={COLOR_TEXT_PRIMARY} />
        </TouchableOpacity>
      ) : (
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>{initials}</Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={ACTIVE_OPACITY}
        style={styles.favoriteButton}
        onPress={onFavoritePress}
      >
        <Ionicons
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={18}
          color={isFavorited ? COLORS.nexoPink : COLOR_TEXT_PRIMARY}
        />
      </TouchableOpacity>
    </View>
  );
}

type HeroInfoProps = Readonly<{
  title: string;
  rating: number;
  genres: string[];
}>;

function HeroInfo({ title, rating, genres }: HeroInfoProps) {
  return (
    <View style={styles.content}>
      <View style={styles.genreContainer}>
        {genres.map((genre) => (
          <View key={genre} style={styles.genreTag}>
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
  );
}

export default function FeaturedGame({
  title,
  image,
  rating,
  genres = [],
  onFavoritePress,
  onBackPress,
  isFavorited = false,
  topInset = DEFAULT_TOP_INSET,
}: FeaturedGameProps) {
  const imageSource = useMemo<ImageSourcePropType>(
    () => (typeof image === 'string' ? { uri: image } : image),
    [image]
  );

  const logoInitials = useMemo(
    () => title.slice(0, LOGO_INITIALS_LENGTH).toUpperCase(),
    [title]
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageSource}
        style={styles.background}
        imageStyle={styles.image}
      >
        <LinearGradient colors={GRADIENT_COLORS} style={styles.overlay} />

        <HeroTopBar
          topInset={topInset}
          initials={logoInitials}
          isFavorited={isFavorited}
          onBackPress={onBackPress}
          onFavoritePress={onFavoritePress}
        />

        <HeroInfo title={title} rating={rating} genres={genres} />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: HERO_BG,
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
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xl,
    backgroundColor: COLOR_OVERLAY_BACK_BTN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLOR_LOGO_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: FONT.family.body,
    color: COLOR_TEXT_PRIMARY,
    fontSize: FONT.text,
    fontWeight: '900',
  },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xl,
    backgroundColor: COLOR_OVERLAY_FAV_BTN,
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
    gap: SPACING.xs,
    marginBottom: 14,
  },
  genreTag: {
    backgroundColor: COLOR_GENRE_BG,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  genreText: {
    fontFamily: FONT.family.body,
    color: COLOR_TEXT_GENRE,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontFamily: FONT.family.heading,
    color: COLOR_TEXT_PRIMARY,
    fontSize: 40,
    lineHeight: 40,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    width: '80%',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontFamily: FONT.family.body,
    color: STAR_COLOR,
    fontSize: FONT.caption,
    marginRight: 6,
  },
  rating: {
    fontFamily: FONT.family.body,
    color: STAR_COLOR,
    fontSize: FONT.subtitle,
    fontWeight: '800',
  },
  reviewText: {
    fontFamily: FONT.family.body,
    color: COLOR_TEXT_REVIEW,
    fontSize: 9,
    marginLeft: 4,
    fontWeight: '700',
  },
});
