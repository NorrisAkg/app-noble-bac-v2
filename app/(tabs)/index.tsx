import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Search, Bell } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { AdsBanner } from "@/components/home/AdsBanner";
import { BookCover } from "@/components/home/BookCover";
import { FlashQuizCard } from "@/components/home/FlashQuizCard";
import { PremiumBanner } from "@/components/home/PremiumBanner";
import { QuoteCard } from "@/components/home/QuoteCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { IllustrationEmptyBooks } from "@/components/ui/EmptyIllustrations";
import { getNextBacDate } from "@/constants/bacDates";
import { adsService } from "@/services/adsService";
import { catalogService } from "@/services/catalogService";
import { getLastRead, getMeStats } from "@/services/meService";
import { getProfile } from "@/services/profileService";
import { getUnreadCount } from "@/services/notificationApiService";
import { quizService } from "@/services/quizService";
import { quotesService } from "@/services/quotesService";
import type { Advertisement, Book, LastRead, Quote, UserProfile } from "@/types/api";

// Palette deterministe pour habiller les covers livres (le backend n'expose
// pas de couleur de couverture). Indexe par subject.id, fallback gris.
const BOOK_PALETTE = [
  { color: "#1F3A66", accent: "#F2C744" },
  { color: "#0F5C42", accent: "#9DEBA2" },
  { color: "#7A2326", accent: "#FFC2A6" },
  { color: "#4A2A6B", accent: "#D6B6FF" },
  { color: "#1F4E5A", accent: "#9DECEC" },
  { color: "#5C3A1F", accent: "#FFD89A" },
] as const;

function bookColors(book: Book): { color: string; accent: string } {
  const subjectId = book.subject?.id ?? 0;
  return (
    BOOK_PALETTE[subjectId % BOOK_PALETTE.length] ?? {
      color: "#3A4250",
      accent: "#D5DAE0",
    }
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) => (
  <View style={styles.sectionHeader}>
    <View
      style={{ flexDirection: "row", alignItems: "baseline", gap: 6, flex: 1 }}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Profil enrichi pour le countdown localise par pays UEMOA.
  const profileQuery = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileQuery.data;

  const countryCode = profile?.country.code ?? null;
  const bacDateParts = useMemo(() => {
    const d = getNextBacDate(countryCode);
    return {
      day: d.getDate(),
      month: d.toLocaleDateString("fr-FR", { month: "short" }),
    };
  }, [countryCode]);
  const bacDateFormatted = useMemo(
    () =>
      getNextBacDate(countryCode).toLocaleDateString("fr-FR", {
        year: "numeric",
      }),
    [countryCode],
  );
  const daysRemaining = useMemo(() => {
    const ms = getNextBacDate(countryCode).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [countryCode]);

  // Top 6 livres du catalog backend (filtres par scope cote backend via Sanctum user).
  const booksQuery = useQuery({
    queryKey: ["home", "books"],
    queryFn: () => catalogService.getBooks({ per_page: 6 }),
    staleTime: 10 * 60 * 1000,
  });
  const books: Book[] = booksQuery.data?.data ?? [];

  const adsQuery = useQuery<Advertisement[]>({
    queryKey: ["home", "ads"],
    queryFn: adsService.getAds,
    staleTime: 15 * 60 * 1000,
  });
  const ads: Advertisement[] = adsQuery.data ?? [];

  // Citations motivantes — rotation côté client (cf. maquette), liste stable.
  const quotesQuery = useQuery<Quote[]>({
    queryKey: ["home", "quotes"],
    queryFn: quotesService.getQuotes,
    staleTime: 60 * 60 * 1000,
  });
  const quotes: Quote[] = quotesQuery.data ?? [];

  // Quiz éclair du jour — planifié par série, change à minuit.
  const dailyQuizQuery = useQuery({
    queryKey: ["home", "daily-quiz"],
    queryFn: quizService.getDailyQuiz,
    staleTime: 5 * 60 * 1000,
  });
  const dailyQuiz = dailyQuizQuery.data ?? null;

  // Stats agrégées : alimente le « prêt à X % » du countdown.
  const statsQuery = useQuery({
    queryKey: ["me", "stats"],
    queryFn: getMeStats,
    staleTime: 60 * 1000,
  });
  const readinessPct =
    statsQuery.data != null && statsQuery.data.quiz_count > 0
      ? Math.round(statsQuery.data.average_score_pct)
      : null;

  // Dernière lecture pour la carte « Reprendre » (null si rien d'ouvert).
  const lastReadQuery = useQuery<LastRead | null>({
    queryKey: ["me", "last-read"],
    queryFn: getLastRead,
    staleTime: 60 * 1000,
  });
  const lastRead = lastReadQuery.data ?? null;

  const { guard, isPremium } = usePremiumGate();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 60 * 1000,
  });
  const unreadCount = unreadQuery.data ?? 0;

  const firstName = user?.first_name ?? "Étudiant";
  const initials = firstName[0]?.toUpperCase() ?? "E";

  const handleBookPress = (book: Book) => {
    guard(book, () => {
      router.push({
        pathname: "/pdf-viewer",
        params: {
          bookId: String(book.id),
          title: book.title,
          subject: book.subject?.name ?? "",
        },
      });
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <StatusBar style="light" />

      {/* ── HERO HEADER ────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
        {/* Dot-grid decoration */}
        <View style={styles.dotGrid} pointerEvents="none">
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>

        {/* Top row: avatar + name + search + bell */}
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Salut,</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {firstName} {user?.last_name ?? ""}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/search")}
          >
            <Search size={18} color="#fff" strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={18} color="#fff" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress card — countdown localise par pays, « prêt à X % »
            alimenté par /me/stats (moyenne des quiz, masqué sans session). */}
        <View style={styles.progressCard}>
          <View style={styles.daysBox}>
            <Text style={styles.daysNum}>{bacDateParts.day}</Text>
            <Text style={styles.daysMonth}>{bacDateParts.month}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle} numberOfLines={1}>
              {profile != null
                ? `BAC ${bacDateFormatted} · ${profile.country.name} · Bac ${profile.series.code}`
                : `BAC ${bacDateFormatted}`}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${readinessPct ?? 0}%` }]}
              />
            </View>
            <Text style={styles.progressPct}>
              Plus que <Text style={styles.progressPctBold}>{daysRemaining} jours</Text>
              {readinessPct != null ? ` · prêt à ${readinessPct} %` : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bande « Reprendre » — FIXE, chevauche le hero (cf. maquette).
          Câblée sur /me/last-read, CTA d'amorçage quand rien n'est ouvert. */}
      <View style={styles.resumeBand}>
        <TouchableOpacity
          style={styles.resumeCard}
          activeOpacity={0.85}
          onPress={() => {
            if (lastRead?.readable_type === "lesson") {
              router.push({
                pathname: "/course-reader",
                params: {
                  lessonId: String(lastRead.readable_id),
                  subject: lastRead.subject_name ?? "Cours",
                },
              });
            } else if (lastRead != null) {
              router.push("/(tabs)/library");
            } else {
              router.push("/(tabs)/courses");
            }
          }}
        >
          <View style={styles.resumeIcon}>
            <Text style={styles.resumeEmoji}>📚</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.resumeEyebrow}>Reprendre</Text>
            <Text style={styles.resumeTitle} numberOfLines={1}>
              {lastRead != null
                ? [lastRead.subject_name, lastRead.title]
                    .filter(Boolean)
                    .join(" · ") || "Ta dernière lecture"
                : "Commence ta première leçon"}
            </Text>
            <View style={styles.resumeTrack}>
              <View
                style={[
                  styles.resumeFill,
                  { width: `${lastRead?.progress_pct ?? 0}%` },
                ]}
              />
            </View>
            <Text style={styles.resumeSubtitle}>
              {lastRead != null
                ? lastRead.page_current != null && lastRead.page_total != null
                  ? `Page ${lastRead.page_current} / ${lastRead.page_total}`
                  : "Reprends là où tu t'étais arrêté."
                : "Choisis une matière pour démarrer."}
            </Text>
          </View>
          <View style={styles.resumePlayBtn}>
            <Text style={styles.resumePlayText}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching || booksQuery.isRefetching}
            onRefresh={() => {
              profileQuery.refetch();
              booksQuery.refetch();
              adsQuery.refetch();
              quotesQuery.refetch();
              dailyQuizQuery.refetch();
              lastReadQuery.refetch();
              statsQuery.refetch();
            }}
            tintColor="#3DBE45"
          />
        }
      >
        {/* Quiz éclair du jour — masqué si rien n'est planifié pour la série */}
        {dailyQuiz != null && <FlashQuizCard quiz={dailyQuiz} />}

        {/* Bannière Premium — masquée pour les abonnés */}
        {!isPremium && (
          <PremiumBanner onPress={() => router.push("/subscription-plans")} />
        )}

        {/* Books carousel — donnees reelles depuis GET /courses/books */}
        <SectionHeader
          title="Bibliothèque"
          subtitle="Ouvrages recommandés"
          action="Voir tout"
          onAction={() => router.push("/books")}
        />
        {booksQuery.isLoading && books.length === 0 ? (
          <View style={styles.bookCarouselLoader}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : books.length === 0 ? (
          <EmptyState
            illustration={IllustrationEmptyBooks}
            title="Aucun livre disponible"
            description="De nouveaux livres seront bientôt ajoutés pour ta série."
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: 4 }}
            style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
          >
            {books.map((b) => {
              const palette = bookColors(b);
              return (
                <BookCover
                  key={b.id}
                  book={{
                    title: b.title,
                    subject: b.subject?.name ?? "Général",
                    color: palette.color,
                    accent: palette.accent,
                    free: b.is_free,
                  }}
                  hidePremiumBadge={isPremium}
                  onPress={() => handleBookPress(b)}
                />
              );
            })}
          </ScrollView>
        )}

        {/* Carrousel publicités externes — masqué sans pub active */}
        <View style={{ marginTop: 26 }}>
          <AdsBanner ads={ads} />
        </View>

        {/* Citations motivantes — masquées sans citation active */}
        {quotes.length > 0 && (
          <>
            <SectionHeader title="Un mot pour aujourd'hui" />
            <QuoteCard quotes={quotes} />
          </>
        )}
      </ScrollView>

      {/* Premium gate handled globally via PremiumGateProvider (cf. _layout.tsx). */}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hero
  hero: {
    backgroundColor: "#3DBE45",
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: "relative",
    overflow: "hidden",
  },
  dotGrid: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 80,
    height: 80,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    opacity: 0.18,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  greeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  heroName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15.5,
    color: "#fff",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E14B36",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    lineHeight: 11,
  },
  progressCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  daysBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  daysNum: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 20,
    color: "#3DBE45",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  daysMonth: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
    color: "#3DBE45",
    lineHeight: 11,
    textTransform: "capitalize",
  },
  progressTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  progressTrack: {
    marginTop: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  progressPct: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  progressPctBold: {
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  bookCarouselLoader: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Body
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#1A2027",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#9AA3AC",
    flexShrink: 1,
  },
  sectionAction: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#3DBE45",
    flexShrink: 0,
  },
  // Resume band (fixe, chevauche le hero — cf. maquette)
  resumeBand: {
    marginTop: -36,
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 5,
  },
  resumeCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#1A2027",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  resumeEyebrow: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10.5,
    color: "#3DBE45",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: "#1A2027",
  },
  resumeSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: "#9AA3AC",
    marginTop: 2,
  },
  resumeTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E6E8EB",
    overflow: "hidden",
  },
  resumeFill: {
    height: "100%",
    backgroundColor: "#3DBE45",
    borderRadius: 2,
  },
  resumePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF7EB",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumePlayText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#3DBE45",
    lineHeight: 22,
    marginTop: -2,
  },
  resumeEmoji: {
    fontSize: 22,
  },
  // Modal / Bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,20,16,0.55)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E6E8EB",
    marginBottom: 18,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FBEDE8",
  },
  premiumBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#D38576",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sheetTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 20,
    color: "#1A2027",
    letterSpacing: -0.4,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 6,
  },
  sheetBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#5A6470",
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
  featureList: {
    width: "100%",
    marginTop: 18,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3DBE45",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#1A2027",
  },
  premiumBtn: {
    width: "100%",
    height: 54,
    marginTop: 18,
    borderRadius: 27,
    backgroundColor: "#3DBE45",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3DBE45",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  premiumBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  laterBtn: {
    width: "100%",
    height: 44,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  laterBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13.5,
    color: "#5A6470",
  },
});
