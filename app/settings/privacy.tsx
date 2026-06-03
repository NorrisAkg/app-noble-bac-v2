import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const H2 = ({ children }: { children: string }) => (
    <Text style={styles.h2}>{children}</Text>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Text style={styles.updatedDate}>Dernière mise à jour : 1er avril 2026</Text>
        <Text style={styles.h1}>Politique de confidentialité</Text>
        
        <Text style={styles.p}>
          Le Noble BAC UEMOA collecte un minimum de données pour fournir l&apos;app : ton nom, ton email,
          ton numéro de téléphone, ton pays et ta série de Bac. Ces informations restent stockées sur des
          serveurs sécurisés et ne sont jamais revendues.
        </Text>

        <H2>1. Données collectées</H2>
        <Text style={styles.p}>
          Identité (prénom, nom), contact (email, téléphone), scope d&apos;étude (pays + série),
          progression pédagogique (quiz, sujets consultés), historique de paiements.
        </Text>

        <H2>2. Conservation</H2>
        <Text style={styles.p}>
          Les données sont conservées tant que ton compte est actif. À la suppression de ton compte,
          elles sont effacées sous 30 jours, à l&apos;exception des journaux de paiement conservés conformément aux lois fiscales UEMOA.
        </Text>

        <H2>3. Tes droits</H2>
        <Text style={styles.p}>
          Tu peux à tout moment accéder, modifier ou supprimer tes données depuis ton profil. Pour toute
          demande spécifique, écris-nous à privacy@noblebac.com.
        </Text>

        <H2>4. Partenaires</H2>
        <Text style={styles.p}>
          Nous utilisons des partenaires de confiance pour les paiements, l&apos;hébergement et les communications. Chacun reçoit le strict minimum nécessaire à sa fonction.
        </Text>

        <H2>5. Contact</H2>
        <Text style={styles.p}>
          Délégué à la protection des données : privacy@noblebac.com. Tu peux aussi nous
          contacter via Profil → Support.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 24,
  },
  updatedDate: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#9AA3AC',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  h1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#1A2027',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1A2027',
    marginTop: 20,
    marginBottom: 8,
  },
  p: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#5A6470',
    lineHeight: 22,
    marginBottom: 12,
  },
});
