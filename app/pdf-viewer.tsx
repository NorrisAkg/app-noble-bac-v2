import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';

export default function PdfViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title, subject } = useLocalSearchParams<{ url: string; title: string; subject: string }>();
  const [loading, setLoading] = useState(true);

  if (!url) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>URL du document introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3DBE45' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use Google Docs viewer on Android, direct URI on iOS
  const sourceUri = Platform.OS === 'android'
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
    : url;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top spacer for status bar */}
      <View style={{ height: insets.top, backgroundColor: '#1A2027' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Document PDF'}
          </Text>
          {subject && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subject}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3DBE45" />
            <Text style={styles.loaderText}>Chargement du document...</Text>
          </View>
        )}
        
        <WebView
          source={{ uri: sourceUri }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          scalesPageToFit={true}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Bottom spacer for home indicator */}
      <View style={{ height: insets.bottom, backgroundColor: '#F5F5F5' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3138', // Dark background around the document
  },
  header: {
    backgroundColor: '#1A2027',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderText: {
    marginTop: 12,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#5A6470',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
