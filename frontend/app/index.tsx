import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="../(auth)/login" style={styles.link}>
        Ir para Login
      </Link>

      <Link href="/(tabs)/profile" style={styles.link}>
        Ir para Perfil
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
  },
});