import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function AccountScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to access the admin area.', [
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
        <Text style={styles.eyebrow}>ADMINISTRATION</Text>
        <Text style={[styles.title, { color: theme.text }]}>Account</Text>
        <View style={[styles.profileRow, { borderColor: theme.backgroundSelected }]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{session?.user.full_name?.charAt(0) ?? 'A'}</Text></View>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: theme.text }]}>{session?.user.full_name ?? 'Administrator'}</Text>
            <Text style={[styles.detail, { color: theme.textSecondary }]}>{session?.user.employee_id}</Text>
            <Text style={styles.role}>Administrator</Text>
          </View>
        </View>
        <Text style={[styles.backendNote, { color: theme.textSecondary }]}>This API does not provide an admin-profile or server-side logout endpoint. Logging out clears the locally stored session.</Text>
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
  content: { paddingHorizontal: 22, paddingTop: 24, width: '100%', maxWidth: 760, alignSelf: 'center' },
  eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', marginBottom: 25 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 20 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#d9eee9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#155c54', fontSize: 20, fontWeight: '700' },
  profileCopy: { gap: 4 },
  name: { fontSize: 17, fontWeight: '700' },
  detail: { fontSize: 13 },
  role: { color: '#17766c', fontSize: 12, fontWeight: '700' },
  backendNote: { fontSize: 13, lineHeight: 20, marginTop: 18, marginBottom: 24 },
  logoutButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#a33434', borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.82 },
});