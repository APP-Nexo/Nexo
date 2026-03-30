import { StyleSheet, Text, View, TextStyle, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type LogoProps = {
  size?: number;
  subtitle?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export default function logo({
  size = 42,
  subtitle = true,
  containerStyle,
  textStyle,
}: LogoProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <MaskedView
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[styles.logoText, { fontSize: size }, textStyle]}>NEXO</Text>
          </View>
        }
      >
        <LinearGradient
          colors={['#20E3FF', '#7DEBFF', '#FFD0E5', '#FF2D7A']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.8, y: 0.5 }}
          style={[styles.gradient, { height: size * 1.25 }]}
        />
      </MaskedView>

      <Text style={styles.subtitle}>rate games • own your taste</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  maskContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: 220,
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#7F8696',
    letterSpacing: 0.4,
  },
});