import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { LogoMark } from '../../components/LogoMark';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { AuthTextField } from './AuthTextField';
import { useAuthStore } from './authStore';

type LoginNavigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<LoginNavigation>();
  const logInLocal = useAuthStore(state => state.logInLocal);
  const startGuest = useAuthStore(state => state.startGuest);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  const handleLogin = () => {
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    logInLocal(email);
    navigation.reset({
      index: 0,
      routes: [{ name: 'LocationSetup' }],
    });
  };

  const handleContinueWithoutLogin = () => {
    startGuest();
    navigation.navigate('LocationSetup');
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <LogoMark size={72} />
          <View style={styles.titleBlock}>
            <AppText variant="headline" weight="700">
              Welcome back
            </AppText>
            <AppText variant="body" color="onSurfaceVariant">
              Sign in locally or continue offline without an account.
            </AppText>
          </View>
        </View>

        <View style={styles.form}>
          <AuthTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <AuthTextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            showPasswordToggle
            error={errors.password}
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Log In" onPress={handleLogin} />
          <View style={styles.createAccountPrompt}>
            <AppText variant="body" color="onSurfaceVariant" align="center">
              Don't have an account?
            </AppText>
            <Pressable
              accessibilityLabel="Create a new account"
              accessibilityRole="button"
              hitSlop={20}
              onPress={() => navigation.navigate('SignUp')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <AppText
                variant="label"
                color="primary"
                weight="700"
                align="center"
                style={styles.createAccountLink}
              >
                Create a new one
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottomAction}>
        <Pressable
          accessibilityRole="button"
          onPress={handleContinueWithoutLogin}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText variant="label" color="primary" weight="700">
            Continue without login
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingScreen>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      <AppText variant="label" color="onPrimaryContainer" weight="700">
        {label}
      </AppText>
    </Pressable>
  );
}

function validateLogin(
  email: string,
  password: string,
): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};

  if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password.trim()) {
    errors.password = 'Enter your password.';
  }

  return errors;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  bottomAction: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  createAccountPrompt: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  createAccountLink: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
