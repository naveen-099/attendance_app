import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function EmployeeHomeScreen() {
  const theme = useTheme();
  const { session, isRestoring, signOut } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isRestoring) {
      if (!session || session.user.role !== 'employee') {
        router.replace(session?.user.role === 'admin' ? '/(admin)/dashboard' : '/');
      } else if (session.user.is_first_login_required) {
        router.replace('/change-password');
      }
    }
  }, [isRestoring, session]);

  if (isRestoring || session?.user.role !== 'employee' || session.user.is_first_login_required) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color="#1b5fd8" />
      </SafeAreaView>
    );
  }

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          setIsSigningOut(true);
          void signOut()
            .catch(() => undefined)
            .finally(() => {
              setIsSigningOut(false);
              router.replace('/');
            });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>EMPLOYEE WORKSPACE</Text>
        <Text style={[styles.title, { color: theme.text }]}>Welcome, {session.user.full_name ?? 'Employee'}</Text>
        <Text style={[styles.employeeId, { color: theme.textSecondary }]}>{session.user.employee_id}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Attendance actions aren’t available yet</Text>
          <Text style={styles.noticeText}>Your account is signed in. The backend does not currently expose employee attendance or check-in endpoints.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
          {isSigningOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Log out</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 32, width: '100%', maxWidth: 760, alignSelf: 'center' },
  eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 9 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  employeeId: { marginTop: 5, fontSize: 14 },
  notice: { marginTop: 30, backgroundColor: '#f2f6f8', borderRadius: 8, padding: 17, gap: 7 },
  noticeTitle: { color: '#17252c', fontSize: 15, fontWeight: '700' },
  noticeText: { color: '#53656d', fontSize: 14, lineHeight: 21 },
  logoutButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#a33434', borderRadius: 8, marginTop: 24 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.82 },
});