import { COLORS, SPACING, FONT } from '../constants';

import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

const PrimaryButton = ({
  title,
  onPress,
  width = '100%',
  height = 54,
  style,
}: PrimaryButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        { width, height },
        style,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {

    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.nexoBlue,
    backgroundColor: '#04141A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.text,
    letterSpacing: 1,
  },
});