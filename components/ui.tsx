import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export const colors = {
  bg: '#f6f2eb',
  surface: '#ffffff',
  surfaceMuted: '#efe8dc',
  ink: '#1f2933',
  muted: '#667085',
  border: '#ded6c9',
  accent: '#0f766e',
  accentDark: '#115e59',
  danger: '#b42318',
  gold: '#b7791f',
};

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppText({
  children,
  style,
  ...props
}: PropsWithChildren<TextProps & { style?: StyleProp<TextStyle> }>) {
  return (
    <Text {...props} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

export function Title({ children }: PropsWithChildren) {
  return <AppText style={styles.title}>{children}</AppText>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <AppText style={styles.eyebrow}>{children}</AppText>;
}

export function Pill({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: 'neutral' | 'accent' | 'gold' }>) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'accent' && styles.pillAccent,
        tone === 'gold' && styles.pillGold,
      ]}>
      <AppText
        style={[
          styles.pillText,
          tone === 'accent' && styles.pillAccentText,
          tone === 'gold' && styles.pillGoldText,
        ]}>
        {children}
      </AppText>
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  variant = 'primary',
}: PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      <AppText
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.buttonTextSecondary,
          disabled && styles.buttonTextDisabled,
        ]}>
        {children}
      </AppText>
    </Pressable>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
      <AppText style={styles.muted}>{label}</AppText>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  text: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 34,
  },
  eyebrow: {
    color: colors.accentDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  muted: {
    color: colors.muted,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillAccent: {
    backgroundColor: '#d7f0eb',
  },
  pillGold: {
    backgroundColor: '#faedcd',
  },
  pillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  pillAccentText: {
    color: colors.accentDark,
  },
  pillGoldText: {
    color: colors.gold,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  buttonTextSecondary: {
    color: colors.accentDark,
  },
  buttonTextDisabled: {
    color: colors.muted,
  },
  loading: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
});
