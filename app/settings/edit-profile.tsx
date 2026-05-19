import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { C } from '@/constants/theme';
import { getProfile, updateProfile } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { UpdateProfilePayload, UserProfile } from '@/types/api';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialise les champs editables des que le profile est charge.
  useEffect(() => {
    if (profile != null) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.back();
      }, 1000);
    },
    onError: (err) => {
      Alert.alert('Mise à jour impossible', getApiErrorMessage(err));
    },
  });

  const isDirty =
    profile != null && (firstName !== profile.first_name || lastName !== profile.last_name);

  const handleSave = () => {
    if (!isDirty) {
      router.back();
      return;
    }
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length < 2 || trimmedLast.length < 2) {
      Alert.alert('Champs trop courts', 'Le prénom et le nom doivent contenir au moins 2 caractères.');
      return;
    }
    // Backend `sometimes` : on ne fait passer que les champs modifies pour
    // ne pas re-valider tout le payload inutilement.
    const payload: UpdateProfilePayload = {};
    if (trimmedFirst !== profile?.first_name) {
      payload.first_name = trimmedFirst;
    }
    if (trimmedLast !== profile?.last_name) {
      payload.last_name = trimmedLast;
    }
    updateMutation.mutate(payload);
  };

  const initials = profile
    ? `${profile.first_name?.charAt(0).toUpperCase() ?? ''}${profile.last_name?.charAt(0).toUpperCase() ?? ''}`
    : '...';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar Edit — gradient `135deg green→greenDark` aligné maquette
            `screens-profile-extras.jsx:33`. */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[C.green, C.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={16} color={C.green} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Touche la photo pour la changer</Text>
        </View>

        {isLoadingProfile && profile == null ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ton prénom"
                placeholderTextColor="#9AA3AC"
                maxLength={120}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ton nom"
                placeholderTextColor="#9AA3AC"
                maxLength={120}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputReadonly]}
                value={profile?.email ?? '—'}
                editable={false}
              />
              <Text style={styles.helperText}>Modification de l&apos;email indisponible pour l&apos;instant.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={[styles.input, styles.inputReadonly]}
                value={profile?.phone ?? '—'}
                editable={false}
              />
              <Text style={styles.helperText}>
                Le téléphone est l&apos;identifiant du compte (vérification OTP). Pour le changer, contacte le support.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, success && styles.saveBtnSuccess]}
              onPress={handleSave}
              disabled={updateMutation.isPending || success}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : success ? (
                <View style={styles.successContent}>
                  <Check color="#fff" size={20} strokeWidth={3} />
                  <Text style={styles.saveBtnText}>Enregistré</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: '#fff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#9AA3AC',
  },
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#1A2027',
    paddingLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#1A2027',
    borderWidth: 1,
    borderColor: '#E5E9EB',
  },
  inputReadonly: {
    backgroundColor: '#F1F3F5',
    color: '#5A6470',
  },
  helperText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#9AA3AC',
    paddingLeft: 4,
  },
  saveBtn: {
    backgroundColor: '#3DBE45',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  saveBtnSuccess: {
    backgroundColor: '#2A9B33',
  },
  saveBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
