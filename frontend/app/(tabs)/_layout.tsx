import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../../constants';

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index].name;

  const isActive = (routeName: string) =>
    currentRoute === routeName;

  const renderTab = (
    routeName: string,
    label: string,
    IconComponent: any,
    iconName: string
  ) => {
    const active = isActive(routeName);
    const color = active
      ? COLORS.nexoBlue
      : COLORS.textSecondary;

    return (
      <Pressable
        key={routeName}
        style={styles.tabItem}
        onPress={() => navigation.navigate(routeName)}
      >
        <IconComponent name={iconName} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>
          {label}
        </Text>
        {active && <View style={styles.activeDot} />}
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: insets.bottom }
      ]}
    >
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
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
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
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
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