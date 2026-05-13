import { Tabs as ExpoTabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function TabLayout() {
  return (
    <ExpoTabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <ExpoTabs.Screen
        name="index"
        options={{
          title: 'Accueil',
        }}
      />
      <ExpoTabs.Screen
        name="courses"
        options={{
          title: 'Cours',
        }}
      />
      <ExpoTabs.Screen
        name="library"
        options={{
          title: 'Sujets',
        }}
      />
      <ExpoTabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
        }}
      />
      <ExpoTabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </ExpoTabs>
  );
}
