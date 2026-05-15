import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [settings, setSettings] = useState({
    pushAll: true,
    reminders: true,
    newContent: true,
    premiumOffers: false,
    email: true,
    sms: false,
  });

  const toggleSwitch = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <Text style={styles.sectionLabel}>{children}</Text>
  );

  const SettingsRow = ({ label, sub, value, onToggle, last }: any) => (
    <View style={[styles.settingsRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#D5DAE0', true: '#3DBE45' }}
        thumbColor={value ? '#fff' : '#fff'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>Canaux</SectionLabel>
        <View style={styles.card}>
          <SettingsRow 
            label="Push (mobile)" 
            sub="Sur ton téléphone" 
            value={settings.pushAll} 
            onToggle={() => toggleSwitch('pushAll')}
          />
          <SettingsRow 
            label="Email" 
            sub="awa.diallo@example.com" 
            value={settings.email} 
            onToggle={() => toggleSwitch('email')}
          />
          <SettingsRow 
            label="SMS" 
            sub="+221 77 123 45 67" 
            value={settings.sms} 
            onToggle={() => toggleSwitch('sms')}
            last
          />
        </View>

        <SectionLabel>Catégories</SectionLabel>
        <View style={styles.card}>
          <SettingsRow 
            label="Rappels de révision" 
            sub="Un rappel par jour pour avancer" 
            value={settings.reminders} 
            onToggle={() => toggleSwitch('reminders')}
          />
          <SettingsRow 
            label="Nouveau contenu" 
            sub="Nouveaux sujets, fiches, vidéos" 
            value={settings.newContent} 
            onToggle={() => toggleSwitch('newContent')}
          />
          <SettingsRow 
            label="Offres Premium" 
            sub="Promotions et nouveautés Noble+" 
            value={settings.premiumOffers} 
            onToggle={() => toggleSwitch('premiumOffers')}
            last
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#9AA3AC',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    marginBottom: 10,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
  },
  rowSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 2,
  },
});
