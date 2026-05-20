import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, X, ChevronDown, Check } from 'lucide-react-native';
import { Image } from 'expo-image';

import { AppBar } from '@/components/ui/AppBar';
import { Toast, type ToastTone } from '@/components/ui/Toast';
import { catalogService } from '@/services/catalogService';
import { courseService } from '@/services/courseService';
import { useDownloadedSet } from '@/hooks/useDownloadedSet';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getApiErrorMessage } from '@/utils/apiError';
import { C } from '@/constants/theme';
import type { Book, Subject } from '@/types/api';
import { FilterSheet } from '@/components/books/FilterSheet';

type PickerType = 'subject' | 'author' | null;

interface ToastState {
  visible: boolean;
  message: string;
  tone: ToastTone;
}

/**
 * Palette pour les couvertures de livres quand `book.cover_url` est absent.
 * Le backend ne donne ni l'icon_slug ni un kind pour les livres ; on déduit
 * la palette à partir du nom de matière via une fonction déterministe.
 *
 * Le bug précédent (`BOOK_GRADIENTS[book.subject?.id ? 'maths' : 'phys']`)
 * faisait que TOUS les livres avec un subject prenaient maths et tous les
 * autres prenaient phys — sans aucun rapport avec la matière réelle.
 */
const COVER_PALETTES: [string, string][] = [
  ['#3DBE45', '#2EA037'], // green
  ['#E8A090', '#D38576'], // salmon
  ['#3D7BBE', '#2C5A8C'], // info blue
  ['#FFB876', '#E8624C'], // tomato
  ['#7B5BD6', '#5B41A8'], // violet (utilisé dans Courses)
];

/**
 * Hash léger d'une chaîne, pour indexer COVER_PALETTES de façon
 * déterministe (même livre = même couleur entre deux rendus).
 */
function pickCoverPalette(subjectName: string | undefined | null): [string, string] {
  const key = (subjectName ?? '').toLowerCase();
  if (key.startsWith('math')) return COVER_PALETTES[0];
  if (key.startsWith('phys')) return COVER_PALETTES[1];
  if (key.startsWith('svt') || key.startsWith('bio')) return COVER_PALETTES[0];
  if (key.startsWith('fr')) return COVER_PALETTES[1];
  if (key.startsWith('hist')) return COVER_PALETTES[2];
  if (key.startsWith('philo')) return COVER_PALETTES[4];
  if (key.startsWith('angl')) return COVER_PALETTES[2];
  // Fallback : hash simple sur les charcodes du nom.
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return COVER_PALETTES[h % COVER_PALETTES.length];
}

const INITIAL_TOAST: ToastState = { visible: false, message: '', tone: 'info' };

export default function BooksLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  // Filtre `Auteur` aligné maquette `screens-profile-extras.jsx:549-553`.
  // Le backend `ListBooksRequest` n'expose pas `?author=`, donc on filtre
  // localement sur le résultat de l'API (limité par la pagination max
  // `per_page=50`). À migrer vers un filtre serveur quand l'API exposera
  // un paramètre dédié.
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST);

  const showError = useCallback((message: string) => {
    setToast({ visible: true, message, tone: 'error' });
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await catalogService.getBooks({
        search: searchQuery,
        subject_id: selectedSubject?.id,
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to load books:', error);
      showError(getApiErrorMessage(error, 'Impossible de charger la bibliothèque.'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSubject, showError]);

  const loadInitialData = useCallback(async () => {
    try {
      const subjData = await courseService.getSubjects();
      setSubjects(subjData);
      await loadBooks();
    } catch (error) {
      console.error('Failed to load initial library data:', error);
      showError(getApiErrorMessage(error, 'Impossible de charger les matières.'));
    } finally {
      setLoading(false);
    }
  }, [loadBooks, showError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadBooks();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedSubject, loadBooks]);

  // Liste des auteurs uniques dérivée du jeu de livres actuel, triée alpha.
  // Filtre les valeurs null/empty pour ne pas polluer le picker.
  const availableAuthors = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      if (b.author && b.author.trim().length > 0) set.add(b.author.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [books]);

  // Filtrage local par auteur. Si le filtre est inactif, on garde tout.
  const filteredBooks = useMemo(() => {
    if (!selectedAuthor) return books;
    return books.filter((b) => b.author === selectedAuthor);
  }, [books, selectedAuthor]);

  const activeFiltersCount =
    (selectedSubject ? 1 : 0) +
    (selectedAuthor ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject(null);
    setSelectedAuthor(null);
  };

  const { guard } = usePremiumGate();

  const handleOpenBook = (book: Book) => {
    guard(book, () => {
      router.push({
        pathname: '/pdf-viewer',
        params: {
          bookId: book.id.toString(),
          title: book.title,
          subject: book.subject?.name || '',
        },
      });
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <AppBar title="Bibliothèque" onBack={() => router.back()} />

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

        {/* Filter Pills — 2 filtres alignés maquette (Matière + Auteur) */}
        <View style={styles.filtersRow}>
          <FilterPill
            label="Matière"
            value={selectedSubject?.name || null}
            onPress={() => setPickerType('subject')}
          />
          <FilterPill
            label="Auteur"
            value={selectedAuthor}
            onPress={() => setPickerType('author')}
            disabled={availableAuthors.length === 0}
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

      {/* Grid — utilise filteredBooks (filtre Auteur côté client appliqué
          au-dessus de la réponse API filtrée par search + subject). */}
      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && filteredBooks.length === 0 ? (
          <ActivityIndicator size="large" color={C.green} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridInner}>
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => handleOpenBook(book)}
              />
            ))}
          </View>
        )}

        {!loading && filteredBooks.length === 0 && (
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
        allLabel="Toutes les matières"
        options={subjects.map((s) => s.name)}
        selectedValue={selectedSubject?.name ?? null}
        onSelect={(val) => {
          if (val === null) {
            setSelectedSubject(null);
            return;
          }
          const found = subjects.find((s) => s.name === val);
          setSelectedSubject(found ?? null);
        }}
      />

      <FilterSheet
        isOpen={pickerType === 'author'}
        onClose={() => setPickerType(null)}
        title="Choisir un auteur"
        allLabel="Tous les auteurs"
        options={availableAuthors}
        selectedValue={selectedAuthor}
        onSelect={(val) => setSelectedAuthor(val)}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        tone={toast.tone}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}

interface FilterPillProps {
  label: string;
  value: string | null;
  onPress: () => void;
  disabled?: boolean;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, value, onPress, disabled }) => {
  const active = !!value;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Text
        style={[
          styles.pillText,
          active && styles.pillTextActive,
          disabled && styles.pillTextDisabled,
        ]}
        numberOfLines={1}
      >
        {active ? value : label}
      </Text>
      <ChevronDown
        size={14}
        color={active ? '#fff' : disabled ? C.ink3 : C.ink2}
        style={{ marginLeft: 4 }}
      />
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
  // Fallback gracieux si l'auteur ou la matière sont null côté backend
  // (vu sur certains livres legacy). Évite l'affichage `null · undefined`.
  const authorLabel = book.author?.trim() || '—';
  const subjectLabel = book.subject?.name?.trim() || '—';

  return (
    <TouchableOpacity style={styles.bookCard} activeOpacity={0.8} onPress={onPress}>
      <BookCover book={book} isDownloaded={isDownloaded} />
      <Text style={styles.bookTitle} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.bookMeta} numberOfLines={1}>
        {authorLabel} · {subjectLabel}
      </Text>
    </TouchableOpacity>
  );
};

const BookCover: React.FC<{ book: Book; isDownloaded?: boolean }> = ({ book, isDownloaded }) => {
  const [coverPrimary] = pickCoverPalette(book.subject?.name);
  return (
    <View style={styles.coverContainer}>
      <View style={[styles.coverColor, { backgroundColor: coverPrimary }]} />

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
    backgroundColor: C.bg,
  },
  headerArea: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: C.bg,
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
    backgroundColor: C.green,
    borderColor: C.green,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: C.ink,
    maxWidth: 140,
  },
  pillTextActive: {
    color: '#fff',
  },
  pillTextDisabled: {
    color: C.ink3,
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
  // 2 colonnes garanties : `justifyContent: 'space-between'` répartit la
  // colonne gauche et droite. Pas de `gap` ici car combiné à width 48% il
  // déborderait sur les écrans étroits (96% + 14px > 100%) et provoquerait
  // un repli à 1 colonne. L'espacement vertical est porté par `bookCard.marginBottom`.
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
