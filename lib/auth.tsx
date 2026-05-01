import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {
  ClerkProvider,
  useAuth,
  useSignIn,
  useSignUp,
  useUser,
} from '@clerk/clerk-expo';
import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { demoProfiles } from '@/data/demoData';
import { Profile } from '@/lib/types';

type AuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  authMode: 'demo' | 'clerk';
  getSupabaseAccessToken: () => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  continueAsDemo: (role?: Profile['role']) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const supabaseJwtTemplate = process.env.EXPO_PUBLIC_SUPABASE_JWT_TEMPLATE ?? 'supabase';

export function AuthProvider({ children }: PropsWithChildren) {
  const hasClerkKey = Boolean(clerkPublishableKey);

  if (!hasClerkKey) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

function DemoAuthProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded: true,
      isSignedIn: Boolean(profile),
      profile,
      authMode: 'demo',
      getSupabaseAccessToken: async () => null,
      signInEmail: async () => {
        setProfile(demoProfiles[0]);
      },
      signUpEmail: async () => {
        setProfile(demoProfiles[0]);
      },
      continueAsDemo: (role = 'user') => {
        setProfile(demoProfiles.find((item) => item.role === role) ?? demoProfiles[0]);
      },
      signOut: async () => {
        setProfile(null);
      },
    }),
    [profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthBridge({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut, userId } = useAuth();
  const { user } = useUser();
  const signInState = useSignIn();
  const signUpState = useSignUp();

  const profile = useMemo<Profile | null>(() => {
    if (!isSignedIn || !userId) {
      return null;
    }

    return {
      id: userId,
      clerkUserId: userId,
      email: user?.primaryEmailAddress?.emailAddress ?? '',
      displayName: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Hammershark user',
      role: 'user',
    };
  }, [isSignedIn, user, userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      profile,
      authMode: 'clerk',
      getSupabaseAccessToken: async () =>
        getToken({ template: supabaseJwtTemplate }).catch(() => null),
      signInEmail: async (email: string, password: string) => {
        if (!signInState.isLoaded) {
          throw new Error('Clerk sign-in is still loading.');
        }

        const result = await signInState.signIn.create({
          identifier: email,
          password,
        });

        if (result.status !== 'complete') {
          throw new Error('Additional Clerk verification is required for this sign-in.');
        }

        await signInState.setActive({ session: result.createdSessionId });
      },
      signUpEmail: async (email: string, password: string) => {
        if (!signUpState.isLoaded) {
          throw new Error('Clerk sign-up is still loading.');
        }

        const result = await signUpState.signUp.create({
          emailAddress: email,
          password,
        });

        if (result.status !== 'complete') {
          throw new Error('Check Clerk email verification settings before completing sign-up.');
        }

        await signUpState.setActive({ session: result.createdSessionId });
      },
      continueAsDemo: () => undefined,
      signOut: async () => {
        await clerkSignOut();
      },
    }),
    [clerkSignOut, getToken, isLoaded, isSignedIn, profile, signInState, signUpState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useHammersharkAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useHammersharkAuth must be used inside AuthProvider.');
  }

  return context;
}
