import { COLORS, FONT } from '../constants';

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
  disabled?: boolean;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  width = '100%',
  height = 54,
  style,
}: PrimaryButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        { width, height },
        style,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
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
  buttonDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.disabled,
  },
  text: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.text,
    letterSpacing: 1,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
});
