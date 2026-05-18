import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Search, X, ChevronDown, Check } from 'lucide-react-native';
import { Image } from 'expo-image';

import { catalogService } from '@/services/catalogService';
import { courseService } from '@/services/courseService';
import { useDownloadedSet } from '@/hooks/useDownloadedSet';
import type { Book, Subject } from '@/types/api';
import { FilterSheet } from '@/components/books/FilterSheet';

// Fallback gradient colors for book covers
const BOOK_GRADIENTS: Record<string, [string, string]> = {
  maths: ['#3DBE45', '#2EA037'],
  phys: ['#E8A090', '#D38576'],
  svt: ['#3DBE45', '#2EA037'],
  fr: ['#E8A090', '#D38576'],
  hg: ['#3DBE45', '#2EA037'],
  philo: ['#E8A090', '#D38576'],
  angl: ['#3DBE45', '#2EA037'],
};

export default function BooksLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [pickerType, setPickerType] = useState<'subject' | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadBooks();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedSubject]);

  const loadInitialData = async () => {
    try {
      const subjData = await courseService.getSubjects();
      setSubjects(subjData);
      await loadBooks();
    } catch (error) {
      console.error("Failed to load initial library data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const response = await catalogService.getBooks({
        search: searchQuery,
        subject_id: selectedSubject?.id,
      });
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeFiltersCount = (selectedSubject ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject(null);
  };

  const handleOpenBook = (book: Book) => {
    // Navigate to PDF viewer
    // We'll need a signed URL for the PDF in the next step
    router.push({
      pathname: '/pdf-viewer',
      params: { 
        bookId: book.id.toString(),
        title: book.title,
        subject: book.subject?.name || ''
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Bibliothèque</Text>
      </View>

      <View style={styles.headerArea}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9AA3AC" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par titre…"
            placeholderTextColor="#9AA3AC"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <X size={14} color="#5A6470" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <FilterPill
            label="Matière"
            value={selectedSubject?.name || null}
            onPress={() => setPickerType('subject')}
          />
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <Text style={styles.countText}>
            {books.length} ouvrage{books.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView 
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && books.length === 0 ? (
          <ActivityIndicator size="large" color="#3DBE45" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridInner}>
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => handleOpenBook(book)}
              />
            ))}
          </View>
        )}

        {!loading && books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun livre ne correspond à tes filtres.</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.emptyResetBtn}>
              <Text style={styles.emptyResetText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheets for Filters */}
      <FilterSheet
        isOpen={pickerType === 'subject'}
        onClose={() => setPickerType(null)}
        title="Choisir une matière"
        options={subjects.map(s => s.name)}
        selectedValue={selectedSubject?.name || 'Toutes'}
        onSelect={(val) => {
          const found = subjects.find(s => s.name === val);
          setSelectedSubject(found || null);
        }}
      />
    </View>
  );
}

const FilterPill = ({ label, value, onPress }: { label: string; value: string | null; onPress: () => void }) => {
  const active = !!value;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {active ? value : label}
      </Text>
      <ChevronDown size={14} color={active ? '#fff' : '#5A6470'} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

/**
 * Carte d'un livre dans la liste. Encapsule BookCover et lit l'etat
 * "deja telecharge" via useDownloadedSet (cache TanStack Query partage
 * avec l'ecran "Mes telechargements" et le bouton dans pdf-viewer).
 */
const BookCard: React.FC<{ book: Book; onPress: () => void }> = ({ book, onPress }) => {
  const downloaded = useDownloadedSet();
  const isDownloaded = downloaded.isDownloaded('book', book.id);

  return (
    <TouchableOpacity style={styles.bookCard} activeOpacity={0.8} onPress={onPress}>
      <BookCover book={book} isDownloaded={isDownloaded} />
      <Text style={styles.bookTitle} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.bookMeta} numberOfLines={1}>
        {book.author} · {book.subject?.name}
      </Text>
    </TouchableOpacity>
  );
};

const BookCover: React.FC<{ book: Book; isDownloaded?: boolean }> = ({ book, isDownloaded }) => {
  return (
    <View style={styles.coverContainer}>
      <View style={[styles.coverColor, { backgroundColor: BOOK_GRADIENTS[book.subject?.id ? 'maths' : 'phys'][0] }]} />

      {book.cover_url ? (
        <Image
          source={{ uri: book.cover_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>{(book.subject?.name || 'BK').slice(0, 3).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.coverBinding} />

      {isDownloaded === true && (
        <View style={styles.downloadedBadge} accessibilityLabel="Téléchargé hors-ligne">
          <Check size={11} color="#fff" strokeWidth={3} />
        </View>
      )}

      {book.is_free ? (
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>GRATUIT</Text>
        </View>
      ) : (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>⭐</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appBar: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#fff',
  },
  headerArea: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: '#1A2027',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
  },
  pillActive: {
    backgroundColor: '#3DBE45',
    borderColor: '#3DBE45',
  },
  pillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1A2027',
  },
  pillTextActive: {
    color: '#fff',
  },
  resetBtn: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  resetText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#D38576',
  },
  countText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#9AA3AC',
    marginTop: Platform.OS === 'ios' ? 2 : 0,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  bookCard: {
    width: '48%', // Approx half with gap
    alignItems: 'center',
    marginBottom: 16,
  },
  coverContainer: {
    width: 120,
    height: 164,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  coverColor: {
    ...StyleSheet.absoluteFillObject,
  },
  coverBinding: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 12,
    right: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-10deg' }],
  },
  coverBadgeText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 12,
    color: '#1A2027',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumText: {
    fontSize: 12,
  },
  downloadedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 8,
    color: '#1A2027',
  },
  bookTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#1A2027',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
    width: '100%',
  },
  bookMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: '#9AA3AC',
    textAlign: 'center',
    width: '100%',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#9AA3AC',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyResetBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  emptyResetText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#3DBE45',
  },
});
