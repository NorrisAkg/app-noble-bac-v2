import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Download, Eye, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { COURSE_SUBJECTS } from '@/constants/coursesData';
import { CustomBottomSheet } from '@/components/ui/BottomSheet';

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
const TABS = [
  { id: 'epreuve', label: 'Épreuve' },
  { id: 'corrige', label: 'Corrigé' },
  { id: 'video', label: 'Vidéo' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [year, setYear] = useState(2024);
  const [tab, setTab] = useState('epreuve');
  const [subject, setSubject] = useState(COURSE_SUBJECTS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Mock profile data
  const profile = { country: { name: 'Sénégal' }, series: 'L1' };

  const handleOpenPdf = (title: string) => {
    router.push({
      pathname: '/pdf-viewer',
      params: { 
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
        title,
        subject: subject.label
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Status bar spacer */}
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Sujets BAC</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.headerSection}>
          <View style={styles.profileRow}>
            <Text style={styles.profileText}>
              {profile.country.name} · Bac {profile.series}
            </Text>
          </View>

          {/* Subject selector button */}
          <TouchableOpacity 
            style={styles.subjectSelector} 
            activeOpacity={0.8}
            onPress={() => setPickerOpen(true)}
          >
            <View style={styles.subjectIconWrap}>
              <Text style={styles.subjectIconText}>{subject.label[0]}</Text>
            </View>
            <View style={styles.subjectSelectorContent}>
              <Text style={styles.subjectLabel}>Matière</Text>
              <Text style={styles.subjectValue}>{subject.label}</Text>
            </View>
            <ChevronDown size={20} color="#5A6470" />
          </TouchableOpacity>

          {/* Years Scroller */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearsScroll}
            style={styles.yearsContainer}
          >
            {YEARS.map((y) => {
              const active = y === year;
              return (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearBtn, active && styles.yearBtnActive]}
                  onPress={() => setYear(y)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.yearText, active && styles.yearTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setTab(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content list */}
        <ScrollView 
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'epreuve' && (
            <DocCard
              title={`${subject.label} · BAC ${year}`}
              meta="Durée 4h · Coef. 6"
              extra="12 pages · 2,4 Mo"
              kind="pdf"
              onOpen={() => handleOpenPdf(`Épreuve ${year}`)}
            />
          )}
          {tab === 'corrige' && (
            <DocCard
              title={`Corrigé · ${subject.label} ${year}`}
              meta="Détaillé étape par étape"
              extra="18 pages · 3,1 Mo"
              kind="pdf-green"
              onOpen={() => handleOpenPdf(`Corrigé ${year}`)}
            />
          )}
          {tab === 'video' && (
            <>
              <VideoCard title={`${subject.label} · BAC ${year} — Exercice 1`} duration="14:32" />
              <VideoCard title={`${subject.label} · BAC ${year} — Exercice 2`} duration="22:08" />
              <VideoCard title={`${subject.label} · BAC ${year} — Problème final`} duration="36:45" />
            </>
          )}
        </ScrollView>
      </View>

      {/* Subject Picker Sheet */}
      <CustomBottomSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir une matière"
      >
        <View style={styles.sheetGrid}>
          {COURSE_SUBJECTS.map((s) => {
            const active = s.k === subject.k;
            return (
              <TouchableOpacity
                key={s.k}
                style={[styles.sheetItem, active && styles.sheetItemActive]}
                onPress={() => {
                  setSubject(s);
                  setPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetIconWrap, active && styles.sheetIconWrapActive]}>
                  <Text style={[styles.sheetIconText, active && styles.sheetIconTextActive]}>
                    {s.label[0]}
                  </Text>
                </View>
                <Text style={[styles.sheetItemLabel, active && styles.sheetItemLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </CustomBottomSheet>
    </View>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

const DocCard = ({ title, meta, extra, kind, onOpen }: any) => {
  const isGreen = kind === 'pdf-green';
  
  return (
    <TouchableOpacity style={styles.docCard} activeOpacity={0.8} onPress={onOpen}>
      <View style={[styles.docThumb, isGreen ? styles.docThumbGreen : styles.docThumbSalmon]}>
        <Text style={[styles.docThumbText, isGreen ? styles.docThumbTextGreen : styles.docThumbTextSalmon]}>
          PDF
        </Text>
        <View style={[styles.docThumbFold, isGreen ? styles.docThumbFoldGreen : styles.docThumbFoldSalmon]} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docMeta}>{meta}</Text>
        <Text style={styles.docExtra}>{extra}</Text>
        
        <View style={styles.docActions}>
          <TouchableOpacity style={styles.docActionBtnPrimary} activeOpacity={0.8}>
            <Download size={14} color="#fff" strokeWidth={2.5} />
            <Text style={styles.docActionTextPrimary}>Télécharger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.docActionBtnSecondary} activeOpacity={0.8} onPress={onOpen}>
            <Eye size={14} color="#5A6470" strokeWidth={2.5} />
            <Text style={styles.docActionTextSecondary}>Aperçu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const VideoCard = ({ title, duration }: any) => {
  return (
    <TouchableOpacity style={styles.videoCard} activeOpacity={0.8}>
      <View style={styles.videoThumb}>
        <View style={styles.videoPlayBtn}>
          <Play size={20} color="#3DBE45" strokeWidth={2.5} style={{ marginLeft: 3 }} />
        </View>
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>{duration}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{title}</Text>
        <Text style={styles.videoSub}>Vidéo officielle Noble BAC</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

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
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#5A6470',
  },
  subjectSelector: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#3DBE45',
  },
  subjectSelectorContent: {
    flex: 1,
  },
  subjectLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10.5,
    color: '#9AA3AC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  subjectValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
    lineHeight: 18,
  },
  yearsContainer: {
    marginBottom: 12,
  },
  yearsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  yearBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBtnActive: {
    backgroundColor: '#3DBE45',
    borderColor: '#3DBE45',
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 4,
  },
  yearText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1A2027',
  },
  yearTextActive: {
    color: '#fff',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabBtnActive: {
    backgroundColor: '#E8A090',
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#5A6470',
  },
  tabTextActive: {
    color: '#fff',
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Document Card
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  docThumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumbGreen: {
    backgroundColor: '#EAF7EB',
  },
  docThumbSalmon: {
    backgroundColor: '#FBEDE8',
  },
  docThumbText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  docThumbTextGreen: {
    color: '#3DBE45',
  },
  docThumbTextSalmon: {
    color: '#D38576',
  },
  docThumbFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
    borderTopWidth: 12,
  },
  docThumbFoldGreen: {
    borderTopColor: '#D4EBD6',
  },
  docThumbFoldSalmon: {
    borderTopColor: '#F5D9D1',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
    color: '#1A2027',
  },
  docMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#5A6470',
    marginTop: 4,
  },
  docExtra: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 8,
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  docActionBtnPrimary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docActionTextPrimary: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  docActionBtnSecondary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docActionTextSecondary: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#5A6470',
  },
  // Video Card
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  videoThumb: {
    height: 130,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  videoInfo: {
    padding: 14,
  },
  videoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
  },
  videoSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 4,
  },
  // Bottom Sheet Grid
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  sheetItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E6E8EB',
    borderRadius: 14,
    gap: 10,
  },
  sheetItemActive: {
    backgroundColor: '#EAF7EB',
    borderColor: '#3DBE45',
  },
  sheetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconWrapActive: {
    backgroundColor: '#3DBE45',
  },
  sheetIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#5A6470',
  },
  sheetIconTextActive: {
    color: '#fff',
  },
  sheetItemLabel: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#1A2027',
  },
  sheetItemLabelActive: {
    color: '#3DBE45',
  },
});
