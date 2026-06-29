import React from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

interface AnimatedCardProps extends ViewProps {
  delay?: number;
}

export function AnimatedCard({
  delay = 0,
  children,
  style,
}: AnimatedCardProps): React.JSX.Element {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(450)} style={style}>
      {children}
    </Animated.View>
  );
}
