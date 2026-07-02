import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { LogoMark } from '../../components/LogoMark';
import type {
  AuthReturnRouteName,
  RootStackParamList,
} from '../../navigation/types';
import { radius, spacing, useThemeColors } from '../../theme';
import { AuthTextField } from './AuthTextField';
import { useAuthStore } from './authStore';

type LoginNavigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRoute = RouteProp<RootStackParamList, 'Login'>;

export function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<LoginNavigation>();
  const route = useRoute<LoginRoute>();
  const colors = useThemeColors();
  const logInLocal = useAuthStore(state => state.logInLocal);
  const completeLocalAuth = useAuthStore(state => state.completeLocalAuth);
  const startGuest = useAuthStore(state => state.startGuest);
  const isBackupSyncEntry = route.params?.entry === 'backupSync';
  const returnTo = route.params?.returnTo ?? getDefaultReturnTo(route);
  const isInAppLogin = returnTo !== undefined;
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

    if (isInAppLogin) {
      completeLocalAuth({ email });
      resetToReturnRoute(navigation, returnTo);
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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (returnTo) {
      resetToReturnRoute(navigation, returnTo);
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      {isInAppLogin ? (
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}>
            <Icon name="arrowLeft" size={28} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <LogoMark size={72} />
          <View style={styles.titleBlock}>
            <AppText variant="headline" weight="700">
              Welcome back
            </AppText>
            <AppText variant="body" color="onSurfaceVariant">
              {isBackupSyncEntry
                ? 'Log in to prepare backup and sync for your local data.'
                : 'Sign in locally or continue offline without an account.'}
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
              onPress={() =>
                navigation.navigate('SignUp', {
                  entry: isBackupSyncEntry ? 'backupSync' : 'onboarding',
                  returnTo,
                })
              }
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

      {!isInAppLogin ? (
        <View style={styles.bottomAction}>
          <Pressable
            accessibilityRole="button"
            onPress={handleContinueWithoutLogin}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.primarySoft },
              pressed && styles.pressed,
            ]}
          >
            <AppText variant="label" color="primary" weight="700">
              Continue without login
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingScreen>
  );
}

function getDefaultReturnTo(
  route: LoginRoute,
): AuthReturnRouteName | undefined {
  if (route.params?.entry === 'backupSync') {
    return 'BackupSync';
  }

  return undefined;
}

function resetToReturnRoute(
  navigation: LoginNavigation,
  returnTo: AuthReturnRouteName,
): void {
  navigation.reset({
    index: 1,
    routes: [{ name: 'MainTabs' }, { name: returnTo }],
  });
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primaryContainer },
        pressed && styles.pressed,
      ]}
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
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
