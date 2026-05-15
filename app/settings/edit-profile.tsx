import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: 'Awa',
    lastName: 'Diallo',
    email: 'awa.diallo@example.com',
    phone: '+221 77 123 45 67',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.back();
      }, 1000);
    }, 1500);
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#9AA3AC"
      />
    </View>
  );

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
        {/* Avatar Edit */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={16} color="#3DBE45" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Touche la photo pour la changer</Text>
        </View>

        <View style={styles.form}>
          <InputField 
            label="Prénom" 
            value={form.firstName} 
            onChangeText={(t: string) => setForm({...form, firstName: t})}
            placeholder="Ton prénom"
          />
          <InputField 
            label="Nom" 
            value={form.lastName} 
            onChangeText={(t: string) => setForm({...form, lastName: t})}
            placeholder="Ton nom"
          />
          <InputField 
            label="Email" 
            value={form.email} 
            onChangeText={(t: string) => setForm({...form, email: t})}
            placeholder="ton@email.com"
            keyboardType="email-address"
          />
          <InputField 
            label="Téléphone" 
            value={form.phone} 
            onChangeText={(t: string) => setForm({...form, phone: t})}
            placeholder="+221 ..."
            keyboardType="phone-pad"
          />

          <TouchableOpacity 
            style={[styles.saveBtn, success && styles.saveBtnSuccess]} 
            onPress={handleSave}
            disabled={saving || success}
          >
            {saving ? (
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
