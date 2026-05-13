import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { COURSE_SUBJECTS, COURSE_SECTIONS } from '@/constants/coursesData';
import { SubjectChips } from '@/components/courses/SubjectChips';
import { TabChips } from '@/components/courses/TabChips';
import { SectionCard } from '@/components/courses/SectionCard';
import { ChapterRowCard } from '@/components/courses/ChapterRowCard';

const COURSE_TABS = [
  { k: 'cours',  label: 'Cours'  },
  { k: 'fiches', label: 'Fiches' },
  { k: 'videos', label: 'Vidéos' },
];

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState(COURSE_SUBJECTS[4]); // default Français
  const [tab, setTab] = useState('cours');

  const sections = COURSE_SECTIONS[subject.k] || [];
  
  // Track open state for accordions
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => 
    sections[0] ? { [sections[0].id]: true } : {}
  );

  // Keep first section open when subject changes
  React.useEffect(() => {
    setOpenSections(sections[0] ? { [sections[0].id]: true } : {});
  }, [subject.k, sections]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const router = useRouter();

  const handleOpenLesson = (section: any, item: any) => {
    Alert.alert('Leçon', `Ouverture de : ${item.t}\n(Module PDF bientôt disponible)`);
  };

  const handleOpenChapterFiche = (section: any) => {
    // Example PDF URL for testing
    const samplePdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
    router.push({
      pathname: '/pdf-viewer',
      params: { 
        url: samplePdfUrl, 
        title: `Fiche · ${section.title}`,
        subject: subject.label
      }
    });
  };

  const handleOpenChapterVideo = (section: any) => {
    Alert.alert('Vidéo', `Ouverture de la vidéo pour : ${section.title}\n(Module Vidéo bientôt disponible)`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Status bar spacer (green tinted) */}
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      {/* App bar — green, subject name in caps */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{subject.label}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {/* Subject pills (small) */}
        <SubjectChips 
          subjects={COURSE_SUBJECTS} 
          value={subject} 
          onChange={setSubject} 
        />

        {/* Tabs — Cours / Fiches / Vidéos */}
        <TabChips 
          tabs={COURSE_TABS} 
          activeTab={tab} 
          onChange={setTab} 
        />

        {/* Content list */}
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'cours' && sections.map((s) => (
            <SectionCard
              key={s.id}
              section={s}
              open={!!openSections[s.id]}
              onToggle={() => toggleSection(s.id)}
              onItemClick={handleOpenLesson}
            />
          ))}

          {tab === 'fiches' && sections.map((s) => (
            <ChapterRowCard
              key={s.id}
              section={s}
              mode="pdf"
              onClick={() => handleOpenChapterFiche(s)}
            />
          ))}

          {tab === 'videos' && sections.map((s) => (
            <ChapterRowCard
              key={s.id}
              section={s}
              mode="video"
              onClick={() => handleOpenChapterVideo(s)}
            />
          ))}

          {sections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun contenu pour cette matière.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appBar: {
    height: 64,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: '#9AA3AC',
  },
});
