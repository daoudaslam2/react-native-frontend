import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { AuthTextField } from './AuthTextField';
import { useAuthStore } from './authStore';

type SignUpNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'SignUp'
>;

export function SignUpScreen(): React.JSX.Element {
  const navigation = useNavigation<SignUpNavigation>();
  const signUpLocal = useAuthStore(state => state.signUpLocal);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSignUp = () => {
    const nextErrors = validateSignUp({
      fullName,
      email,
      password,
      confirmPassword,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    signUpLocal(fullName, email);
    navigation.reset({
      index: 0,
      routes: [{ name: 'LocationSetup' }],
    });
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.titleBlock}>
          <AppText variant="headline" weight="700">
            Create account
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            Set up a local profile. Cloud sync can come later.
          </AppText>
        </View>

        <View style={styles.form}>
          <AuthTextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            autoCapitalize="words"
            error={errors.fullName}
          />
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
            placeholder="Create password"
            secureTextEntry
            showPasswordToggle
            error={errors.password}
          />
          <AuthTextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            showPasswordToggle
            error={errors.confirmPassword}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignUp}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}>
          <AppText variant="label" color="onPrimaryContainer" weight="700">
            Sign Up
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingScreen>
  );
}

function validateSignUp({
  fullName,
  email,
  password,
  confirmPassword,
}: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
} {
  const errors: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!fullName.trim()) {
    errors.fullName = 'Enter your full name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.md,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  topBar: {
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
