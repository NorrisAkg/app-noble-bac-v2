import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, Layers, CheckSquare, User } from 'lucide-react-native';

// Expo-router augmente BottomTabNavigationOptions avec `href` (null = onglet
// cache du tab bar) et tabBarTestID n'est pas dans les types officiels recents
// de @react-navigation/bottom-tabs mais reste accepte au runtime. On declare
// localement l'extension pour rester typed sans `any`.
type ExpoTabOptions = BottomTabNavigationOptions & {
  href?: string | null;
  tabBarTestID?: string;
};

const TABS_CONFIG = {
  index: { label: 'Accueil', icon: Home },
  courses: { label: 'Cours', icon: BookOpen },
  library: { label: 'Sujets', icon: Layers },
  quiz: { label: 'Quiz', icon: CheckSquare },
  profile: { label: 'Profil', icon: User },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options as ExpoTabOptions;
        const isFocused = state.index === index;

        // Skip hidden tabs or tabs not in our config
        if (options.href === null || !TABS_CONFIG[route.name as keyof typeof TABS_CONFIG]) {
          return null;
        }

        const tabConfig = TABS_CONFIG[route.name as keyof typeof TABS_CONFIG];
        const Icon = tabConfig.icon;
        const color = isFocused ? '#3DBE45' : '#9AA3AC';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
          >
            <Icon size={22} color={color} strokeWidth={isFocused ? 2 : 1.8} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontFamily: isFocused ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
                },
              ]}
            >
              {tabConfig.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    fontSize: 10.5,
  },
});
