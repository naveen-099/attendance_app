import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const { session } = useAuthSession();
  const firstName = session?.user.full_name?.split(' ')[0] ?? 'Administrator';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>OFFICE OPERATIONS</Text>
            <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Good to see you, {firstName}.</Text>
          </View>
          <View style={styles.avatar} accessibilityLabel="Administrator profile">
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.statusBand, { backgroundColor: '#f2f6f8' }]}>
          <View style={styles.statusMark} />
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Attendance metrics unavailable</Text>
            <Text style={[styles.statusDescription, { color: theme.textSecondary }]}>The current API does not provide employee totals, attendance records, or dashboard statistics.</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Available now</Text>
          <Text style={[styles.sectionCaption, { color: theme.textSecondary }]}>Connected backend capability</Text>
        </View>

        <View style={[styles.capabilityRow, { borderColor: theme.backgroundSelected }]}>
          <View style={styles.capabilityIcon}>
            <Text style={styles.capabilityGlyph}>+</Text>
          </View>
          <View style={styles.capabilityCopy}>
            <Text style={[styles.capabilityTitle, { color: theme.text }]}>Create an employee</Text>
            <Text style={[styles.capabilityDescription, { color: theme.textSecondary }]}>Add an employee using the backend's supported creation endpoint.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open employee management"
            onPress={() => router.navigate('/(admin)/employees')}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.actionButtonText}>Open</Text>
          </Pressable>
        </View>

        <Text style={[styles.note, { color: theme.textSecondary }]}>Employee directory, attendance views, approvals, and reporting need backend endpoints before they can show live data.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 36, maxWidth: 760, width: '100%', alignSelf: 'center' },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  eyebrow: { color: '#258177', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#d9eee9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#155c54', fontSize: 18, fontWeight: '700' },
  statusBand: { flexDirection: 'row', alignItems: 'flex-start', padding: 18, borderRadius: 8, gap: 12, marginBottom: 34 },
  statusMark: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c07a25', marginTop: 4 },
  statusCopy: { flex: 1, gap: 5 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusDescription: { fontSize: 14, lineHeight: 21 },
  sectionHeading: { marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionCaption: { fontSize: 13, marginTop: 4 },
  capabilityRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 17, gap: 13 },
  capabilityIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#e5f3ef', alignItems: 'center', justifyContent: 'center' },
  capabilityGlyph: { color: '#17766c', fontSize: 24, lineHeight: 28, fontWeight: '500' },
  capabilityCopy: { flex: 1, gap: 4 },
  capabilityTitle: { fontSize: 15, fontWeight: '700' },
  capabilityDescription: { fontSize: 13, lineHeight: 19 },
  actionButton: { minWidth: 68, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 7, backgroundColor: '#1b5fd8' },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  note: { fontSize: 13, lineHeight: 20, marginTop: 20 },
  pressed: { opacity: 0.8 },
});