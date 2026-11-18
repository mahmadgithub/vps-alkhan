import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GoogleMapPickerModal } from '@/components/google-map-picker-modal';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CardShadow, Radius } from '@/constants/layout';
import * as mobileAuthService from '@/services/mobile-auth-service';
import { useAppTheme } from '@/state/theme-context';

export default function ProfileSettingsScreen() {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<Record<string, any>[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  const load = async () => {
    const [profile, addressList] = await Promise.all([
      mobileAuthService.getProfile(),
      mobileAuthService.listAddresses(),
    ]);
    setName(profile.name ?? '');
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
    setAddresses(addressList);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await mobileAuthService.updateProfile({ name, email });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleMapLocationConfirmed = (location: { address: string; city: string; mapsUrl: string }) => {
    setNewLine1(location.address);
    setNewCity(location.city);
    setGoogleMapsUrl(location.mapsUrl);
    setDialogVisible(true);
  };

  const addAddress = async () => {
    if (!newLine1.trim() || !newCity.trim()) {
      Alert.alert('Please fill address and city');
      return;
    }
    try {
      await mobileAuthService.addAddress({
        addressLine1: newLine1.trim(),
        addressLine2: googleMapsUrl.trim() || undefined,
        city: newCity.trim(),
      });
      setDialogVisible(false);
      setNewLine1('');
      setNewCity('');
      setGoogleMapsUrl('');
      const list = await mobileAuthService.listAddresses();
      setAddresses(list);
    } catch (e) {
      Alert.alert('Could not add address', e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel title="NAME" />
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        <SectionLabel title="EMAIL" />
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        <SectionLabel title="PHONE" />
        <View style={[styles.input, styles.readonlyInput, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary }}>{phone || '—'}</Text>
        </View>

        <PrimaryButton label="Save Changes" onPress={save} loading={saving} />

        <View style={styles.addressesHeader}>
          <SectionLabel title="SAVED ADDRESSES" />
          <Pressable onPress={() => setDialogVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
        {addresses.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No saved addresses yet.</Text>
        ) : (
          addresses.map((addr) => (
            <View key={addr.name} style={[styles.addressCard, { backgroundColor: colors.surface }, CardShadow]}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                  {addr.address_line1}, {addr.city}
                </Text>
                {!!addr.address_line2 && (
                  <Text style={{ color: '#4285F4', fontSize: 11, marginTop: 2 }}>
                    📍 Google Maps Pinned Location
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={dialogVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Add Delivery Address</Text>

            <Pressable
              style={({ pressed }) => [
                styles.locateButton,
                { borderColor: '#EA4335', backgroundColor: '#FCE8E6' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                setDialogVisible(false);
                setMapPickerVisible(true);
              }}>
              <Ionicons name="map" size={18} color="#EA4335" />
              <Text style={styles.locateButtonText}>Select Location on Google Map</Text>
            </Pressable>

            <TextInput
              value={newLine1}
              onChangeText={setNewLine1}
              placeholder="Address / House No / Street"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TextInput
              value={newCity}
              onChangeText={setNewCity}
              placeholder="City (e.g. Lahore)"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TextInput
              value={googleMapsUrl}
              onChangeText={setGoogleMapsUrl}
              placeholder="Google Maps URL (Optional)"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <View style={styles.dialogActions}>
              <Pressable onPress={() => setDialogVisible(false)}>
                <Text style={{ color: colors.textSecondary, marginRight: 20 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addAddress}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Save Address</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <GoogleMapPickerModal
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onConfirmLocation={handleMapLocationConfirmed}
      />
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13.5, marginBottom: 8 },
  readonlyInput: { justifyContent: 'center' },
  addressesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 4 },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: Radius.md, marginBottom: 10 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 },
  dialog: { width: '100%', borderRadius: Radius.lg, padding: 22 },
  dialogTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: 11,
    marginTop: 4,
    marginBottom: 10,
  },
  locateButtonText: { color: '#EA4335', fontSize: 13, fontWeight: '700' },
});
