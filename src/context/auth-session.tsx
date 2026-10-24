import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { ApiError, getCurrentUser, type LoginUser } from '@/services/auth';
import {
  deleteStoredValue,
  getStoredValue,
  setStoredValue,
} from '@/services/storage';

const TOKEN_KEY = 'attendance_token';
const USER_KEY = 'attendance_user';

export type AuthSession = {
  token: string;
  user: LoginUser;
};

type AuthSessionValue = {
  session: AuthSession | null;
  isRestoring: boolean;
  signIn: (token: string, user: LoginUser) => Promise<void>;
  updateUser: (user: LoginUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

function isExpired(token: string) {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return true;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function AuthSessionProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const currentToken = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const [token, userJson] = await Promise.all([
          getStoredValue(TOKEN_KEY),
          getStoredValue(USER_KEY),
        ]);
        const user = userJson ? (JSON.parse(userJson) as LoginUser) : null;

        if (token && (user?.role === 'admin' || user?.role === 'employee') && !isExpired(token) && active) {
          currentToken.current = token;
          setSession({ token, user });
        } else if (token || userJson) {
          await Promise.all([
            deleteStoredValue(TOKEN_KEY),
            deleteStoredValue(USER_KEY),
          ]);
        }
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setIsRestoring(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const token = session.token;
    let active = true;

    const refreshProfile = async () => {
      try {
        const latestUser = await getCurrentUser(token);
        if (!active || currentToken.current !== token) return;

        setSession((current) =>
          current?.token === token ? { ...current, user: latestUser } : current,
        );
        await setStoredValue(USER_KEY, JSON.stringify(latestUser));
      } catch (error: unknown) {
        const invalidSession =
          error instanceof ApiError &&
          (error.status === 401 || (error.status === 404 && error.code === 'USER_NOT_FOUND'));
        if (
          !active ||
          currentToken.current !== token ||
          !invalidSession
        ) {
          return;
        }

        currentToken.current = null;
        setSession(null);
        await Promise.all([
          deleteStoredValue(TOKEN_KEY),
          deleteStoredValue(USER_KEY),
        ]);
      }
    };

    void refreshProfile();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshProfile();
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [session?.token]);

  useEffect(() => {
    if (!session) return;

    try {
      const encodedPayload = session.token.split('.')[1];
      if (!encodedPayload) return;
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { exp?: number };
      if (typeof payload.exp !== 'number') return;

      const remaining = payload.exp * 1000 - Date.now();
      if (remaining <= 0) {
        currentToken.current = null;
        void deleteStoredValue(TOKEN_KEY);
        void deleteStoredValue(USER_KEY);
        setSession(null);
        return;
      }

      const expiryTimer = setTimeout(() => {
        currentToken.current = null;
        setSession(null);
        void deleteStoredValue(TOKEN_KEY);
        void deleteStoredValue(USER_KEY);
      }, remaining);

      return () => clearTimeout(expiryTimer);
    } catch {
      return;
    }
  }, [session]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      session,
      isRestoring,
      signIn: async (token, user) => {
        if (user.role !== 'admin' && user.role !== 'employee') {
          throw new Error('This account role is not supported by the application.');
        }
        await setStoredValue(TOKEN_KEY, token);
        await setStoredValue(USER_KEY, JSON.stringify(user));
        currentToken.current = token;
        setSession({ token, user });
      },
      updateUser: async (user) => {
        setSession((current) => (current ? { ...current, user } : current));
        await setStoredValue(USER_KEY, JSON.stringify(user));
      },
      signOut: async () => {
        currentToken.current = null;
        setSession(null);
        await Promise.all([
          deleteStoredValue(TOKEN_KEY),
          deleteStoredValue(USER_KEY),
        ]);
      },
    }),
    [session, isRestoring],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  return context;
}