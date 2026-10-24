import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, getEmployee, resetEmployeePassword, updateEmployee, type EmployeeDetails, type EmployeePasswordReset } from '@/services/auth';

export default function EmployeeDetailScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuthSession();
  const { employeeId } = useLocalSearchParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetResult, setResetResult] = useState<EmployeePasswordReset | null>(null);

  const loadEmployee = useCallback(async () => {
    if (!session?.token || !employeeId) return;
    setIsLoading(true); setErrorMessage('');
    try {
      const result = await getEmployee(session.token, employeeId);
      setEmployee(result); setFullName(result.full_name); setEmail(result.email); setPhone(result.phone);
      setDepartment(result.department); setDesignation(result.designation);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load employee details.');
    } finally { setIsLoading(false); }
  }, [employeeId, session?.token]);

  useEffect(() => { void loadEmployee(); }, [loadEmployee]);

  const save = async () => {
    if (!session?.token || !employeeId) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) { setErrorMessage('Full name, email, and phone are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorMessage('Enter a valid email address.'); return; }
    setIsSaving(true); setErrorMessage('');
    try {
      const result = await updateEmployee(session.token, employeeId, { full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), department: department.trim(), designation: designation.trim() });
      setEmployee(result); setResetResult(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) { await signOut(); router.replace('/'); return; }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update employee.');
    } finally { setIsSaving(false); }
  };

  const resetPassword = () => {
    Alert.alert('Reset employee password?', 'This invalidates the current password and requires a first-login password change.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset password', style: 'destructive', onPress: () => void performReset() },
    ]);
  };

  const performReset = async () => {
    if (!session?.token || !employeeId) return;
    setIsResetting(true); setErrorMessage(''); setResetResult(null);
    try {
      const result = await resetEmployeePassword(session.token, employeeId);
      setResetResult(result); setEmployee((current) => current ? { ...current, is_first_login_required: true } : current);
    } catch (error: unknown) { setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.'); }
    finally { setIsResetting(false); }
  };

  if (isLoading) return <SafeAreaView style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color="#1b5fd8" /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Employees</Text></Pressable>
          <Text style={styles.eyebrow}>EMPLOYEE PROFILE</Text>
          <Text style={[styles.title, { color: theme.text }]}>{employee?.full_name ?? 'Employee'}</Text>
          <Text style={[styles.employeeId, { color: theme.textSecondary }]}>{employeeId}</Text>
          <View style={employee?.is_first_login_required ? styles.pendingNotice : styles.activeNotice}><Text style={employee?.is_first_login_required ? styles.pendingText : styles.activeText}>{employee?.is_first_login_required ? 'Password change pending on next login' : 'Account active'}</Text></View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Employee details</Text>
          <FormField label="Full name" value={fullName} onChangeText={setFullName} theme={theme} />
          <FormField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" theme={theme} />
          <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" theme={theme} />
          <FormField label="Department" value={department} onChangeText={setDepartment} theme={theme} />
          <FormField label="Designation" value={designation} onChangeText={setDesignation} theme={theme} />
          {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
          {resetResult ? <View style={styles.resetResult}><Text style={styles.resetTitle}>Temporary password generated</Text><Text style={styles.resetPassword}>{resetResult.temporary_password}</Text><Text style={styles.resetHint}>Share this password securely. It will not be shown again.</Text></View> : null}
          <Pressable accessibilityRole="button" disabled={isSaving} onPress={save} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>{isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}</Pressable>

          <View style={styles.resetSection}>
            <Text style={[styles.resetSectionTitle, { color: theme.text }]}>Password request</Text>
            <Text style={[styles.resetSectionCopy, { color: theme.textSecondary }]}>Generate a temporary password and require the employee to change it on next login.</Text>
            <Pressable accessibilityRole="button" disabled={isResetting} onPress={resetPassword} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>{isResetting ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetButtonText}>Reset password</Text>}</Pressable>
          </View>
          {errorMessage && !employee ? <Pressable onPress={() => void loadEmployee()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, keyboardType = 'default', theme }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad'; theme: ReturnType<typeof useTheme> }) {
  return <View style={styles.field}><Text style={[styles.label, { color: theme.text }]}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} autoCorrect={false} keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, { backgroundColor: theme.background, borderColor: theme.backgroundSelected, color: theme.text }]} value={value} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, flex: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 36, maxWidth: 760, width: '100%', alignSelf: 'center' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 10 }, backText: { color: '#1b5fd8', fontSize: 15, fontWeight: '600' }, eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 }, title: { fontSize: 30, lineHeight: 36, fontWeight: '700' }, employeeId: { marginTop: 5, fontSize: 14, marginBottom: 16 },
  pendingNotice: { alignSelf: 'flex-start', backgroundColor: '#fff1c9', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 6, marginBottom: 24 }, pendingText: { color: '#7a4f00', fontSize: 12, fontWeight: '700' }, activeNotice: { alignSelf: 'flex-start', backgroundColor: '#def3e7', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 6, marginBottom: 24 }, activeText: { color: '#175c3b', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 16 }, field: { marginBottom: 15 }, label: { fontSize: 13, fontWeight: '600', marginBottom: 7 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, fontSize: 15 }, error: { color: '#b42318', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  resetResult: { backgroundColor: '#eaf5ef', borderRadius: 8, padding: 16, marginBottom: 14 }, resetTitle: { color: '#175c3b', fontSize: 15, fontWeight: '700' }, resetPassword: { color: '#244637', fontSize: 20, fontWeight: '800', marginVertical: 8 }, resetHint: { color: '#486458', fontSize: 12, lineHeight: 18 }, primaryButton: { height: 50, borderRadius: 8, backgroundColor: '#1b5fd8', alignItems: 'center', justifyContent: 'center', marginTop: 4 }, primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resetSection: { marginTop: 30, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dfe6f2' }, resetSectionTitle: { fontSize: 18, fontWeight: '700' }, resetSectionCopy: { fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 14 }, resetButton: { height: 48, borderRadius: 8, backgroundColor: '#a33434', alignItems: 'center', justifyContent: 'center' }, resetButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' }, retryButton: { alignSelf: 'flex-start', paddingVertical: 8 }, retryText: { color: '#1b5fd8', fontWeight: '700' }, pressed: { opacity: 0.82 },
});
