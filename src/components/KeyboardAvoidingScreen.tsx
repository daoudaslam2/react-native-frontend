import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type KeyboardAvoidingViewProps,
} from 'react-native';

import { Screen, type ScreenProps } from './Screen';

interface KeyboardAvoidingScreenProps extends ScreenProps {
  avoidingViewStyle?: KeyboardAvoidingViewProps['style'];
  keyboardVerticalOffset?: number;
}

export function KeyboardAvoidingScreen({
  avoidingViewStyle,
  keyboardVerticalOffset = 0,
  keyboardShouldPersistTaps = 'handled',
  children,
  ...screenProps
}: KeyboardAvoidingScreenProps): React.JSX.Element {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.container, avoidingViewStyle]}>
      <Screen
        {...screenProps}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
