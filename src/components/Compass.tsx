import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme';

interface CompassProps {
  direction: number;
}

export function Compass({ direction }: CompassProps): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Svg width={312} height={312} viewBox="0 0 312 312">
        <Defs>
          <LinearGradient id="needle" x1="156" y1="20" x2="156" y2="156">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx="156" cy="156" r="148" fill={colors.surfaceLowest} stroke={colors.surfaceVariant} />
        <Circle cx="156" cy="156" r="132" fill="none" stroke={colors.outlineVariant} strokeDasharray="3 8" />
        <G stroke={colors.outlineVariant} strokeLinecap="round">
          {Array.from({ length: 24 }).map((_, index) => {
            const angle = (index * 15 * Math.PI) / 180;
            const outer = 137;
            const inner = index % 6 === 0 ? 121 : 128;
            const x1 = 156 + Math.sin(angle) * inner;
            const y1 = 156 - Math.cos(angle) * inner;
            const x2 = 156 + Math.sin(angle) * outer;
            const y2 = 156 - Math.cos(angle) * outer;

            return (
              <Line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={index % 6 === 0 ? 2 : 1}
              />
            );
          })}
        </G>
        <G rotation={direction} origin="156,156">
          <Line x1="156" y1="52" x2="156" y2="156" stroke="url(#needle)" strokeWidth="8" strokeLinecap="round" />
          <Rect x="140" y="28" width="32" height="32" rx="8" fill={colors.surfaceHighest} stroke={colors.outlineVariant} />
          <Rect x="146" y="38" width="20" height="16" rx="2" fill={colors.inverseSurface} />
          <Line x1="146" y1="43" x2="166" y2="43" stroke={colors.gold} strokeWidth="3" />
        </G>
        <Circle cx="156" cy="156" r="33" fill={colors.surface} stroke={colors.surfaceVariant} />
        <Circle cx="156" cy="156" r="8" fill={colors.primary} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 312,
    height: 312,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 106, 57, 0.05)',
  },
});
