import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Phone, MessageSquare, ChevronDown } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Comment activer mon abonnement Premium ?", a: "Va dans Profil → Premium et choisis le plan qui te convient. Le paiement passe par Wave, Orange Money ou MTN MoMo, et ton compte est crédité automatiquement." },
    { q: "Mon paiement n'est pas arrivé, que faire ?", a: "Vérifie d'abord ta connexion. Si après 10 minutes le statut est toujours « En attente », ouvre Profil → Mes paiements, repère la transaction et contacte-nous avec son numéro." },
    { q: "Puis-je changer de pays ou de série ?", a: "Oui, dans Profil → Pays et série. Si tu es Premium, le scope (pays + série) reste celui souscrit, mais tu peux étendre depuis l'écran Mes paiements." },
    { q: "Les contenus fonctionnent-ils hors-ligne ?", a: "Les utilisateurs Premium peuvent télécharger sujets, corrigés et vidéos. Le bouton 'Télécharger' est dispo sur chaque fiche ou vidéo." },
  ];

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq(openFaq === index ? null : index);
  };

  const ContactRow = ({ icon: Icon, title, sub, last }: any) => (
    <TouchableOpacity style={[styles.contactRow, last && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
      <View style={styles.contactIconContainer}>
        <Icon size={18} color="#3DBE45" />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSub}>{sub}</Text>
      </View>
      <ChevronLeft size={18} color="#D5DAE0" style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Une question, un blocage ?</Text>
          <Text style={styles.heroSub}>On répond en moins de 24h, du lundi au samedi.</Text>
        </View>

        <Text style={styles.sectionLabel}>Nous contacter</Text>
        <View style={styles.card}>
          <ContactRow icon={Mail} title="Email" sub="support@noblebac.com" />
          <ContactRow icon={Phone} title="Appel WhatsApp" sub="+221 77 000 00 00" />
          <ContactRow icon={MessageSquare} title="Chat en direct" sub="Lun-Sam · 9h-19h GMT" last />
        </View>

        <Text style={styles.sectionLabel}>Questions fréquentes</Text>
        <View style={styles.card}>
          {faqs.map((f, i) => (
            <View key={i} style={[styles.faqItem, i === faqs.length - 1 && { borderBottomWidth: 0 }]}>
              <TouchableOpacity 
                style={styles.faqHeader} 
                onPress={() => toggleFaq(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{f.q}</Text>
                <ChevronDown 
                  size={18} 
                  color="#9AA3AC" 
                  style={{ transform: [{ rotate: openFaq === i ? '180deg' : '0deg' }] }} 
                />
              </TouchableOpacity>
              {openFaq === i && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{f.a}</Text>
                </View>
              )}
            </View>
          ))}
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
  heroCard: {
    backgroundColor: '#3DBE45',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  heroSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#9AA3AC',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    marginBottom: 10,
    marginTop: 10,
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
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    paddingLeft: 12,
  },
  contactTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
  },
  contactSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: '#1A2027',
    paddingRight: 12,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#5A6470',
    lineHeight: 19,
  },
});
