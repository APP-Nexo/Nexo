import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING } from '../../constants';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index].name;

        const isActive = (routeName: string) => currentRoute === routeName;

        const renderTab = (
          routeName: string,
          label: string,
          IconComponent: any,
          iconName: string
        ) => {
          const active = isActive(routeName);
          const color = active ? COLORS.nexoBlue : COLORS.textSecondary;

          return (
            <Pressable
              style={styles.tabItem}
              onPress={() => navigation.navigate(routeName)}
            >
              <IconComponent name={iconName} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
              {active && <View style={styles.activeDot} />}
            </Pressable>
          );
        };

        return (
          <View style={styles.tabBarContainer}>
            {renderTab('index', 'HOME', Octicons, 'home')}
            {renderTab(
              'nexo-avaliar-jogo',
              'JOGOS',
              MaterialCommunityIcons,
              'view-grid-outline'
            )}
            {renderTab(
              'profile',
              'PERFIL',
              MaterialCommunityIcons,
              'rhombus-outline'
            )}
          </View>
        );
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="nexo-avaliar-jogo" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 110,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  tabLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    fontWeight: '700',
    marginTop: 5,
    letterSpacing: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.nexoBlue,
    marginTop: 6,
  },
});