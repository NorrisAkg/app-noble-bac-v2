import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Search, X, ChevronDown } from 'lucide-react-native';
import { Image } from 'expo-image';

import { LIBRARY_BOOKS, Book } from '@/constants/booksData';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState<string>('all');
  const [author, setAuthor] = useState<string>('all');
  
  const [pickerType, setPickerType] = useState<'subject' | 'author' | null>(null);

  // Extract unique subjects and authors for the filters
  const allSubjects = useMemo(() => ['all', ...Array.from(new Set(LIBRARY_BOOKS.map(b => b.subject)))], []);
  const allAuthors = useMemo(() => ['all', ...Array.from(new Set(LIBRARY_BOOKS.map(b => b.author)))], []);

  // Filter books based on search and filters
  const filteredBooks = useMemo(() => {
    return LIBRARY_BOOKS.filter((b) => {
      if (subject !== 'all' && b.subject !== subject) return false;
      if (author !== 'all' && b.author !== author) return false;
      if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, subject, author]);

  const activeFiltersCount = (subject !== 'all' ? 1 : 0) + (author !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSubject('all');
    setAuthor('all');
  };

  const handleOpenBook = (book: Book) => {
    // Navigate to PDF viewer (assuming it's a PDF for now)
    router.push({
      pathname: '/pdf-viewer',
      params: { 
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
        title: book.title,
        subject: book.subject
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
            value={subject === 'all' ? null : subject}
            onPress={() => setPickerType('subject')}
          />
          <FilterPill
            label="Auteur"
            value={author === 'all' ? null : author}
            onPress={() => setPickerType('author')}
          />
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <Text style={styles.countText}>
            {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView 
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridInner}>
          {filteredBooks.map((book) => (
            <TouchableOpacity 
              key={book.id} 
              style={styles.bookCard}
              activeOpacity={0.8}
              onPress={() => handleOpenBook(book)}
            >
              <BookCover book={book} />
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.bookMeta} numberOfLines={1}>
                {book.author} · {book.subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredBooks.length === 0 && (
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
        options={allSubjects}
        selectedValue={subject}
        onSelect={(val) => setSubject(val || 'all')}
      />

      <FilterSheet
        isOpen={pickerType === 'author'}
        onClose={() => setPickerType(null)}
        title="Choisir un auteur"
        options={allAuthors}
        selectedValue={author}
        onSelect={(val) => setAuthor(val || 'all')}
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

const BookCover = ({ book }: { book: Book }) => {
  return (
    <View style={styles.coverContainer}>
      <View style={[styles.coverColor, { backgroundColor: BOOK_GRADIENTS[book.colorPrefix || 'maths'][0] }]} />
      {/* Decorative inner book elements */}
      <View style={styles.coverBinding} />
      <View style={styles.coverBadge}>
        <Text style={styles.coverBadgeText}>{book.subject.slice(0, 3).toUpperCase()}</Text>
      </View>
      {book.isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>⭐</Text>
        </View>
      )}
      {!book.isPremium && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>GRATUIT</Text>
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
