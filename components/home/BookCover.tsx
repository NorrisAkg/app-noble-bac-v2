import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";

// Design matches the template "Book Cover (faux 3D paperback)"
interface BookCoverProps {
  book: {
    title: string;
    subject: string;
    color: string;
    accent: string;
    free: boolean;
  };
  onPress: () => void;
  /**
   * Masque le cadenas Premium (typiquement quand l'utilisateur courant est
   * déjà Premium et a accès sans restriction). Le badge GRATUIT reste affiché
   * car c'est une info pertinente même pour les Premium.
   */
  hidePremiumBadge?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  onPress,
  hidePremiumBadge = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.88}
    style={styles.wrapper}
  >
    <View style={[styles.cover, { backgroundColor: book.color }]}>
      {/* Spine highlight */}
      <View style={styles.spine} />

      {/* Subject label */}
      <Text style={[styles.subject, { color: book.accent }]} numberOfLines={1}>
        {book.subject.toUpperCase()}
      </Text>

      {/* Title */}
      <Text style={styles.title} numberOfLines={3}>
        {book.title}
      </Text>

      {/* Brand mark */}
      <Text style={styles.brand}>NOBLE BAC</Text>

      {/* Free badge */}
      {book.free && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>GRATUIT</Text>
        </View>
      )}

      {/* Premium lock — masqué si user est Premium */}
      {!book.free && !hidePremiumBadge && (
        <View style={styles.lockBadge}>
          <Lock size={10} color="#FFC857" strokeWidth={2.4} />
        </View>
      )}
    </View>

    {/* Below cover: title + subject */}
    {/* <Text style={styles.cardTitle} numberOfLines={2}>{book.title}</Text>
    <Text style={styles.cardSubject}>{book.subject}</Text> */}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: {
    width: 116,
    flexShrink: 0,
  },
  cover: {
    width: 116,
    height: 156,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  spine: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  subject: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 10,
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    position: "absolute",
    top: 36,
    left: 14,
    right: 10,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#fff",
    lineHeight: 16,
  },
  brand: {
    position: "absolute",
    bottom: 12,
    left: 14,
    fontFamily: "Poppins_700Bold",
    fontSize: 7.5,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1.5,
  },
  freeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#3DBE45",
    borderBottomLeftRadius: 6,
  },
  freeBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 7.5,
    color: "#fff",
    letterSpacing: 1,
  },
  lockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    marginTop: 8,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#1A2027",
    lineHeight: 16,
  },
  cardSubject: {
    marginTop: 2,
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: "#9AA3AC",
  },
});
