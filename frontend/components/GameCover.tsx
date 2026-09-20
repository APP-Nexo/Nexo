import { View, StyleSheet, type StyleProp, type ViewStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../constants';

type GameCoverProps = {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  radius?: number;
};

/**
 * A game cover image, or a generic "no image" placeholder when the game has
 * no cover — never a stand-in game's real artwork, which would be misleading.
 */
export default function GameCover({ uri, style, iconSize = 22, radius = RADIUS.md }: GameCoverProps) {
  if (!uri) {
    return (
      <View style={[styles.placeholder, { borderRadius: radius }, style]}>
        <Ionicons name="image-outline" size={iconSize} color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ borderRadius: radius }, style] as StyleProp<ImageStyle>}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: COLORS.surface3,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
