import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  normalizePrayerLocation,
  type PrayerLocation,
} from '../../constants/prayerSettings';
import { localStorage } from '../../storage/mmkv';

export type AuthMode = 'guest' | 'localUser';

interface PendingAuthSession {
  authMode: AuthMode;
  displayName: string;
  email: string | null;
}

interface AuthValues {
  authMode: AuthMode | null;
  displayName: string;
  email: string | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  prayerLocation: PrayerLocation | null;
}

interface AuthState extends AuthValues {
  hasHydrated: boolean;
  pendingSession: PendingAuthSession | null;
  logInLocal: (email: string) => void;
  signUpLocal: (fullName: string, email: string) => void;
  startGuest: () => void;
  completeOnboarding: (values: {
    displayName: string;
    prayerLocation: PrayerLocation;
  }) => void;
  updatePrayerLocation: (prayerLocation: PrayerLocation) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

const defaultAuthValues: AuthValues = {
  authMode: null,
  displayName: '',
  email: null,
  isAuthenticated: false,
  onboardingCompleted: false,
  prayerLocation: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      ...defaultAuthValues,
      hasHydrated: false,
      pendingSession: null,
      logInLocal: email =>
        set({
          ...defaultAuthValues,
          pendingSession: {
            authMode: 'localUser',
            displayName: getDisplayNameFromEmail(email),
            email: email.trim(),
          },
        }),
      signUpLocal: (fullName, email) =>
        set({
          ...defaultAuthValues,
          pendingSession: {
            authMode: 'localUser',
            displayName: fullName.trim(),
            email: email.trim(),
          },
        }),
      startGuest: () =>
        set({
          ...defaultAuthValues,
          pendingSession: {
            authMode: 'guest',
            displayName: '',
            email: null,
          },
        }),
      completeOnboarding: ({ displayName, prayerLocation }) =>
        set(state => {
          const pendingSession = state.pendingSession;

          return {
            authMode:
              pendingSession?.authMode ?? state.authMode ?? 'guest',
            displayName: displayName.trim(),
            email: pendingSession?.email ?? state.email,
            prayerLocation:
              normalizePrayerLocation(prayerLocation) ?? prayerLocation,
            isAuthenticated: true,
            onboardingCompleted: true,
            pendingSession: null,
          };
        }),
      updatePrayerLocation: prayerLocation =>
        set(state => {
          const normalizedLocation = normalizePrayerLocation(prayerLocation);

          if (
            !state.isAuthenticated ||
            !state.onboardingCompleted ||
            !normalizedLocation
          ) {
            return {};
          }

          return { prayerLocation: normalizedLocation };
        }),
      setHasHydrated: hasHydrated => set({ hasHydrated }),
    }),
    {
      name: 'al-salah-auth',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => coercePersistedAuth(persistedState),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
      partialize: state => ({
        authMode: state.authMode,
        displayName: state.displayName,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
        onboardingCompleted: state.onboardingCompleted,
        prayerLocation: state.prayerLocation,
      }),
    },
  ),
);

function coercePersistedAuth(persistedState: unknown): AuthValues {
  if (!isRecord(persistedState)) {
    return defaultAuthValues;
  }

  const authMode =
    persistedState.authMode === 'guest' ||
    persistedState.authMode === 'localUser'
      ? persistedState.authMode
      : null;
  const displayName =
    typeof persistedState.displayName === 'string'
      ? persistedState.displayName
      : '';
  const email =
    typeof persistedState.email === 'string' ? persistedState.email : null;
  const isAuthenticated =
    typeof persistedState.isAuthenticated === 'boolean'
      ? persistedState.isAuthenticated
      : false;
  const onboardingCompleted =
    typeof persistedState.onboardingCompleted === 'boolean'
      ? persistedState.onboardingCompleted
      : false;
  const prayerLocation = normalizePrayerLocation(persistedState.prayerLocation);
  const hasCompletedOnboarding =
    isAuthenticated && onboardingCompleted && prayerLocation !== null;

  if (!hasCompletedOnboarding) {
    return defaultAuthValues;
  }

  return {
    authMode,
    displayName,
    email,
    isAuthenticated: true,
    onboardingCompleted: true,
    prayerLocation,
  };
}

function getDisplayNameFromEmail(email: string): string {
  const [name = 'User'] = email.trim().split('@');

  return name || 'User';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
