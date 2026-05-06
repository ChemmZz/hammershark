import { ComponentProps, PropsWithChildren } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  bg: '#f4f6f2',
  surface: '#ffffff',
  surfaceMuted: '#edf2ed',
  ink: '#14211c',
  muted: '#66756d',
  border: '#dce4dc',
  accent: '#0f6f56',
  accentDark: '#0a4d3d',
  danger: '#b42318',
  gold: '#b7791f',
  action: '#e4a11b',
  blue: '#22577a',
};

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView edges={['top']} style={[styles.screen, style]}>{children}</SafeAreaView>;
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
  icon,
  variant = 'primary',
}: PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  icon?: ComponentProps<typeof FontAwesome>['name'];
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
      {icon ? (
        <FontAwesome
          color={variant === 'primary' ? '#ffffff' : colors.accentDark}
          name={icon}
          size={15}
        />
      ) : null}
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
    padding: 14,
  },
  text: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 29,
  },
  eyebrow: {
    color: colors.accentDark,
    fontSize: 11,
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
    flexDirection: 'row',
    gap: 8,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
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
