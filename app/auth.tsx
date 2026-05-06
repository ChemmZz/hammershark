import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  AppText,
  Card,
  Eyebrow,
  Pill,
  PrimaryButton,
  Screen,
  Title,
  colors,
} from '@/components/ui';
import { useHammersharkAuth } from '@/lib/auth';

export default function AuthScreen() {
  const {
    authMode,
    continueAsDemo,
    isSignedIn,
    signInEmail,
    signUpEmail,
  } = useHammersharkAuth();
  const [email, setEmail] = useState('student@uchicago.edu');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const submit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'sign-in') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Eyebrow>Ratner routines</Eyebrow>
            <Title>Hammershark</Title>
            <AppText style={styles.subhead}>
              Trainer-built routine days and machine-aware swaps for the gym floor.
            </AppText>
          </View>

          <Card style={styles.authCard}>
            <View style={styles.rowBetween}>
              <Pill tone={authMode === 'demo' ? 'gold' : 'accent'}>
                {authMode === 'demo' ? 'Local demo' : 'Clerk auth'}
              </Pill>
              <PrimaryButton
                icon={mode === 'sign-in' ? 'user-plus' : 'sign-in'}
                onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                variant="ghost">
                {mode === 'sign-in' ? 'Create' : 'Sign in'}
              </PrimaryButton>
            </View>

            <View style={styles.form}>
              <AppText style={styles.label}>Email</AppText>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="student@uchicago.edu"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={email}
              />

              <AppText style={styles.label}>Password</AppText>
              <TextInput
                onChangeText={setPassword}
                placeholder={authMode === 'demo' ? 'Any value in demo mode' : 'Clerk password'}
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
                value={password}
              />

              {error ? <AppText style={styles.error}>{error}</AppText> : null}

              <PrimaryButton
                disabled={isSubmitting}
                icon={mode === 'sign-in' ? 'sign-in' : 'user-plus'}
                onPress={submit}>
                {isSubmitting ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
              </PrimaryButton>
            </View>
          </Card>

          {authMode === 'demo' ? (
            <View style={styles.demoActions}>
              <PrimaryButton icon="graduation-cap" onPress={() => continueAsDemo('user')} variant="secondary">
                Continue as student
              </PrimaryButton>
              <PrimaryButton icon="user-md" onPress={() => continueAsDemo('trainer')} variant="ghost">
                Continue as trainer
              </PrimaryButton>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 480,
    padding: 20,
    paddingTop: 44,
    width: '100%',
  },
  hero: {
    gap: 6,
  },
  subhead: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  authCard: {
    gap: 18,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  form: {
    gap: 10,
  },
  label: {
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
  demoActions: {
    gap: 10,
    paddingBottom: 24,
  },
});
