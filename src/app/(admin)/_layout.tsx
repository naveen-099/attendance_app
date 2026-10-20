import { NativeTabs } from 'expo-router/native-tabs';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/context/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function AdminLayout() {
  const theme = useTheme();
  const { session, isRestoring } = useAuthSession();

  useEffect(() => {
    if (!isRestoring) {
      if (!session || session.user.role !== 'admin') {
        router.replace('/');
      } else if (session.user.is_first_login_required) {
        router.replace('/change-password');
      }
    }
  }, [isRestoring, session]);

  if (isRestoring || !session || session.user.role !== 'admin' || session.user.is_first_login_required) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color="#1b5fd8" />
      </SafeAreaView>
    );
  }

  return (
    <NativeTabs
      backBehavior="initialRoute"
      backgroundColor={theme.background}
      tintColor="#1b5fd8"
      labelStyle={{ selected: { color: '#1b5fd8' }, default: { color: theme.textSecondary } }}>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="employees">
        <NativeTabs.Trigger.Label>Employees</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="groups" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});