import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
