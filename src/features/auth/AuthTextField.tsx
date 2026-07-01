import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors, fontFamilies, radius, spacing } from '../../theme';

interface AuthTextFieldProps extends Pick<TextInputProps, 'autoCapitalize'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  error?: string;
}

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  secureTextEntry = false,
  showPasswordToggle = false,
  error,
}: AuthTextFieldProps): React.JSX.Element {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.field}>
      <AppText variant="label" color="onSurfaceVariant">
        {label}
      </AppText>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isSecure}
          style={styles.input}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            onPress={() => setIsPasswordVisible(current => !current)}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed && styles.pressed,
            ]}>
            <Icon
              name={isPasswordVisible ? 'eyeOff' : 'eye'}
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="labelSmall" color="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  inputWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLowest,
    paddingLeft: spacing.md,
  },
  inputWrapError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    minHeight: 54,
    padding: 0,
    paddingRight: spacing.md,
    color: colors.onSurface,
    fontFamily: fontFamilies.medium,
    fontSize: 16,
  },
  eyeButton: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
