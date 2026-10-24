import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';
import {
    ApiError,
    createEmployee,
    listEmployees,
    type EmployeeCreateResponse,
    type EmployeeDetails,
} from '@/services/auth';

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  full_name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
};

export default function EmployeesScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuthSession();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState<EmployeeCreateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDetails[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [directoryError, setDirectoryError] = useState('');

  const loadEmployees = useCallback(async (refresh = false) => {
    if (!session?.token) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setDirectoryError('');
    try {
      const result = await listEmployees(session.token, search, 1, 100);
      setEmployees(result.items);
    } catch (error: unknown) {
      setDirectoryError(error instanceof Error ? error.message : 'Unable to load employees.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, session?.token]);

  useEffect(() => {
    const timeout = setTimeout(() => void loadEmployees(), 250);
    return () => clearTimeout(timeout);
  }, [loadEmployees]);

  useFocusEffect(useCallback(() => {
    void loadEmployees(true);
  }, [loadEmployees]));

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setCreated(null);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!values.full_name.trim()) nextErrors.full_name = 'Enter the employee name.';
    if (!values.email.trim()) nextErrors.email = 'Enter an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!values.phone.trim()) nextErrors.phone = 'Enter a contact number.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate() || !session?.token) return;
    setIsSubmitting(true);
    setFormError('');
    setCreated(null);

    try {
      const result = await createEmployee(
        {
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          ...(values.department.trim() ? { department: values.department.trim() } : {}),
          ...(values.designation.trim() ? { designation: values.designation.trim() } : {}),
        },
        session.token,
      );
      setCreated(result);
      setValues(initialValues);
      await loadEmployees(true);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
        router.replace('/');
        return;
      }
      setFormError(error instanceof Error ? error.message : 'Employee could not be created. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          nestedScrollEnabled>
          <Text style={styles.eyebrow}>PEOPLE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Employees</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Create a new employee account.</Text>

          <View style={styles.directoryHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Employee directory</Text>
            <Text style={[styles.directoryCount, { color: theme.textSecondary }]}>{employees.length} employees</Text>
          </View>
          <TextInput
            accessibilityLabel="Search employees"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Search name, ID, email, or phone"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { backgroundColor: theme.background, borderColor: theme.backgroundSelected, color: theme.text }]}
            value={search}
          />

          {isLoading ? (
            <View style={styles.directoryState}><ActivityIndicator color="#1b5fd8" /></View>
          ) : directoryError ? (
            <View style={styles.directoryState}>
              <Text accessibilityRole="alert" style={styles.errorText}>{directoryError}</Text>
              <Pressable onPress={() => void loadEmployees()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
            </View>
          ) : employees.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No employees match this search.</Text>
          ) : employees.map((employee) => (
            <Pressable
              key={employee.employee_id}
              onPress={() => router.push({ pathname: '/(admin)/employee-details', params: { employeeId: employee.employee_id } })}
              style={({ pressed }) => [styles.employeeRow, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <View style={[styles.employeeAvatar, employee.is_first_login_required && styles.pendingAvatar]}>
                <Text style={styles.employeeAvatarText}>{employee.full_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.employeeCopy}>
                <Text style={[styles.employeeName, { color: theme.text }]}>{employee.full_name}</Text>
                <Text style={[styles.employeeMeta, { color: theme.textSecondary }]}>{employee.employee_id} · {employee.department || 'No department'}</Text>
                <Text style={[styles.employeeStatus, employee.is_first_login_required ? styles.pendingStatus : styles.activeStatus]}>
                  {employee.is_first_login_required ? 'Password change pending' : 'Active'}
                </Text>
              </View>
              <Text style={[styles.rowChevron, { color: theme.textSecondary }]}>›</Text>
            </Pressable>
          ))}

          <Text style={[styles.sectionTitle, styles.createSectionTitle, { color: theme.text }]}>New employee</Text>
          <FormField label="Full name" value={values.full_name} onChangeText={(value) => updateField('full_name', value)} error={errors.full_name} placeholder="e.g. Ananya Sharma" theme={theme} />
          <FormField label="Email address" value={values.email} onChangeText={(value) => updateField('email', value)} error={errors.email} placeholder="name@company.com" keyboardType="email-address" theme={theme} />
          <FormField label="Contact number" value={values.phone} onChangeText={(value) => updateField('phone', value)} error={errors.phone} placeholder="Phone number" keyboardType="phone-pad" theme={theme} />
          <FormField label="Department (optional)" value={values.department} onChangeText={(value) => updateField('department', value)} placeholder="Department" theme={theme} />
          <FormField label="Designation (optional)" value={values.designation} onChangeText={(value) => updateField('designation', value)} placeholder="Job title" theme={theme} />

          {formError ? <Text accessibilityRole="alert" style={styles.errorText}>{formError}</Text> : null}

          {created ? (
            <View style={styles.createdNotice}>
              <Text style={styles.createdTitle}>Employee created</Text>
              <Text style={styles.createdText}>Employee ID: {created.employee_id}</Text>
              <Text style={styles.createdText}>Temporary password: {created.temporary_password}</Text>
              <Text style={styles.createdHint}>Share the temporary password with the employee through a secure channel. It is shown here only from the creation response.</Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={submit}
            style={({ pressed }) => [styles.submitButton, (pressed || isSubmitting) && styles.pressed]}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create employee</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        keyboardType={keyboardType ?? 'default'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { backgroundColor: theme.background, borderColor: error ? '#c43b3b' : theme.backgroundSelected, color: theme.text }]}
        value={value}
      />
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 24, maxWidth: 760, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 5, marginBottom: 22 },
  directoryHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  directoryCount: { fontSize: 12 },
  searchInput: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, fontSize: 15, marginBottom: 14 },
  directoryState: { minHeight: 90, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 28 },
  retryButton: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 12 },
  retryText: { color: '#1b5fd8', fontWeight: '700' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', minHeight: 92, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  employeeAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e2eee9', alignItems: 'center', justifyContent: 'center' },
  pendingAvatar: { backgroundColor: '#fff1c9' },
  employeeAvatarText: { color: '#24584d', fontSize: 17, fontWeight: '700' },
  employeeCopy: { flex: 1, gap: 3 },
  employeeName: { fontSize: 15, fontWeight: '700' },
  employeeMeta: { fontSize: 12, lineHeight: 17 },
  employeeStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  pendingStatus: { color: '#8a5d00' }, activeStatus: { color: '#17633f' },
  rowChevron: { fontSize: 30, lineHeight: 32 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 17 },
  createSectionTitle: { marginTop: 30, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  field: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, fontSize: 15 },
  fieldError: { color: '#b42318', fontSize: 12, marginTop: 5 },
  errorText: { color: '#b42318', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  createdNotice: { backgroundColor: '#eaf5ef', borderRadius: 8, padding: 15, gap: 5, marginBottom: 14 },
  createdTitle: { color: '#175c3b', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  createdText: { color: '#244637', fontSize: 14, fontWeight: '600' },
  createdHint: { color: '#486458', fontSize: 12, lineHeight: 18, marginTop: 5 },
  footer: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dfe6f2' },
  submitButton: { height: 50, borderRadius: 8, backgroundColor: '#1b5fd8', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});