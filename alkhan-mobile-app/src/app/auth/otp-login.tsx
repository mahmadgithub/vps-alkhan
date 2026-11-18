import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius } from '@/constants/layout';
import { Fonts } from '@/constants/theme';
import * as mobileAuthService from '@/services/mobile-auth-service';
import { useAuth } from '@/state/auth-context';
import { useAppTheme } from '@/state/theme-context';

export default function OtpLoginScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+92');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Enter a valid phone number');
      return;
    }
    setBusy(true);
    try {
      await mobileAuthService.requestOtp(phone);
      setStep('otp');
    } catch (e) {
      Alert.alert('Could not send OTP', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      const success = await mobileAuthService.verifyOtp(phone, otp);
      if (success) {
        await refresh();
        router.back();
      } else {
        Alert.alert('Incorrect OTP', 'Please check the code and try again.');
      }
    } catch (e) {
      Alert.alert('Could not verify OTP', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleBusy(true);
    try {
      Alert.prompt(
        'Google Sign In',
        'Enter your Google account email:',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setGoogleBusy(false) },
          {
            text: 'Continue with Google',
            onPress: async (userEmail?: string) => {
              if (!userEmail || !userEmail.includes('@')) {
                Alert.alert('Please enter a valid Google email address.');
                setGoogleBusy(false);
                return;
              }
              try {
                const cleanEmail = userEmail.toLowerCase().trim();
                const name = cleanEmail.split('@')[0].replace('.', ' ');
                const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
                const success = await mobileAuthService.loginWithGoogle({
                  email: cleanEmail,
                  name: formattedName,
                });
                if (success) {
                  await refresh();
                  router.back();
                } else {
                  Alert.alert('Sign in failed', 'Could not sign in with Google.');
                }
              } catch (err) {
                Alert.alert('Google Sign In Error', err instanceof Error ? err.message : String(err));
              } finally {
                setGoogleBusy(false);
              }
            },
          },
        ],
        'plain-text',
        'user@gmail.com'
      );
    } catch (e) {
      Alert.alert('Google Sign In Error', e instanceof Error ? e.message : String(e));
      setGoogleBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
        <Ionicons name={step === 'phone' ? 'call-outline' : 'shield-checkmark-outline'} size={26} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {step === 'phone' ? 'Sign in with your phone' : 'Enter the code'}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13.5, marginBottom: 28, lineHeight: 19 }}>
        {step === 'phone'
          ? "We'll text you a 6-digit verification code."
          : `Enter the 6-digit code sent to ${phone}.`}
      </Text>

      {step === 'phone' ? (
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+923001234567"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      ) : (
        <TextInput
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            styles.otpInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
      )}

      <PrimaryButton
        label={step === 'phone' ? 'Send Code' : 'Verify'}
        onPress={step === 'phone' ? sendOtp : verifyOtp}
        loading={busy}
      />

      {step === 'phone' && (
        <>
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
            ]}
            disabled={googleBusy}
            onPress={handleGoogleLogin}>
            {googleBusy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </>
      )}

      {step === 'otp' && (
        <Pressable onPress={() => setStep('phone')} style={styles.changeNumber}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Change phone number</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 21, fontWeight: '700', fontFamily: Fonts.displayBold, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    marginBottom: 22,
  },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: '700' },
  changeNumber: { alignSelf: 'center', marginTop: 18, padding: 6 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { marginHorizontal: 12, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 14,
  },
  googleButtonText: { fontSize: 14, fontWeight: '600' },
});
