import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';
import { loginWithEmployeeId } from '@/services/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const navigation = useRouter();
  const { session, isRestoring, signIn } = useAuthSession();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isRestoring && session) {
      navigation.replace(
        session.user.is_first_login_required
          ? '/change-password'
          : session.user.role === 'admin'
            ? '/(admin)/dashboard'
            : '/employee',
      );
    }
  }, [isRestoring, navigation, session]);

  const isValid = useMemo(
    () => employeeId.trim().length > 0 && password.trim().length > 0,
    [employeeId, password],
  );

  const handleLogin = async () => {
    if (!employeeId.trim()) {
      setErrorMessage('Please enter your employee ID.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await loginWithEmployeeId(employeeId, password);
      const token = result?.data?.token;
      const user = result?.data?.user;

      if (!token || !user) {
        throw new Error('The server did not return an authentication token and user profile.');
      }

      await signIn(token, {
        ...user,
        is_first_login_required:
          user.is_first_login_required ?? result.data?.require_password_change ?? false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRestoring || session) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingScreen, { backgroundColor: theme.background }]}>
        <ActivityIndicator color="#1b5fd8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <View style={[styles.logoBadge, { backgroundColor: '#eaf3ff' }]}>
              <Text style={[styles.logoText, { color: '#1b5fd8' }]}>A</Text>
            </View>
          </View>

          <View style={styles.headerWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Attendance sign in</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to continue to your attendance workspace.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: '#dfe6f2' }]}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Employee ID</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="e.g. EMP-001 or ADMIN-001"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: errorMessage ? '#ef4444' : '#dfe6f2',
                  },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <View
                style={[
                  styles.passwordWrap,
                  {
                    backgroundColor: theme.background,
                    borderColor: errorMessage ? '#ef4444' : '#dfe6f2',
                  },
                ]}>
                <TextInput
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.passwordInput, { color: theme.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  hitSlop={10}
                  style={styles.toggleButton}>
                  <Text style={[styles.toggleText, { color: '#1b5fd8' }]}>
                    {isPasswordVisible ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={!isValid || isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: isValid && !isSubmitting ? '#1b5fd8' : '#9fb6e3',
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </Pressable>

            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Administrator access</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1b5fd8',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
  },
  headerWrap: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 28,
    padding: Spacing.four,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  formGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.one,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleText: {
    fontWeight: '600',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    marginTop: Spacing.three,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
