import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, changePassword } from '@/services/auth';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { session, isRestoring, signOut, updateUser } = useAuthSession();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (isRestoring) return;
    if (!session) {
      router.replace('/');
    } else if (!session.user.is_first_login_required) {
      router.replace(session.user.role === 'admin' ? '/(admin)/dashboard' : '/employee');
    }
  }, [isRestoring, session]);

  if (isRestoring || !session || !session.user.is_first_login_required) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: theme.background }]}>
        <ActivityIndicator color="#1b5fd8" />
      </SafeAreaView>
    );
  }

  const submit = async () => {
    setErrorMessage('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Complete all password fields.');
      return;
    }
    if (newPassword.length < 7 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setErrorMessage('Use at least 7 characters with an uppercase letter, a number, and a special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword(
        session.user.employee_id ?? '',
        oldPassword,
        newPassword,
        confirmPassword,
        session.token,
      );
      if (!result.first_login_completed) {
        throw new Error('The server did not confirm the password change.');
      }

      await updateUser({ ...session.user, is_first_login_required: false });
      router.replace(session.user.role === 'admin' ? '/(admin)/dashboard' : '/employee');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
        router.replace('/');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to change the password. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordInputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.backgroundSelected, color: theme.text }];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
          <Text style={[styles.title, { color: theme.text }]}>Change your password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Set a new password to finish signing in.</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Temporary password</Text>
            <TextInput
              accessibilityLabel="Temporary password"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setOldPassword}
              placeholder="Enter temporary password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!passwordVisible}
              style={passwordInputStyle}
              value={oldPassword}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>New password</Text>
            <TextInput
              accessibilityLabel="New password"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setNewPassword}
              placeholder="Create a new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!passwordVisible}
              style={passwordInputStyle}
              value={newPassword}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Confirm new password</Text>
            <TextInput
              accessibilityLabel="Confirm new password"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!passwordVisible}
              style={passwordInputStyle}
              value={confirmPassword}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide passwords' : 'Show passwords'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.visibilityButton}>
            <Text style={styles.visibilityText}>{passwordVisible ? 'Hide passwords' : 'Show passwords'}</Text>
          </Pressable>

          {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

          <View style={[styles.policy, { backgroundColor: '#f2f6f8' }]}>
            <Text style={[styles.policyText, { color: theme.textSecondary }]}>At least 7 characters, including an uppercase letter, a number, and a special character.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={submit}
            style={({ pressed }) => [styles.submitButton, (pressed || isSubmitting) && styles.pressed]}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update password</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 36, maxWidth: 620, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 25 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, fontSize: 15 },
  visibilityButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  visibilityText: { color: '#1b5fd8', fontSize: 13, fontWeight: '600' },
  error: { color: '#b42318', fontSize: 13, lineHeight: 19, marginTop: 10 },
  policy: { padding: 14, borderRadius: 8, marginTop: 14 },
  policyText: { fontSize: 13, lineHeight: 20 },
  submitButton: { height: 50, borderRadius: 8, backgroundColor: '#1b5fd8', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});