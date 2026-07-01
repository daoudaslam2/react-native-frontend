import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  Rect,
  Stop,
  Text as SvgText,
  LinearGradient,
} from 'react-native-svg';

import { getRelativeQiblaDirection } from '../services/qibla/qiblaDirection';
import { colors } from '../theme';

interface CompassProps {
  qiblaDirection: number;
  heading: number | null;
}

const CENTER = 156;
const QIBLA_BAR_TOP = 58;
const QIBLA_BAR_WIDTH = 9;

export function Compass({
  qiblaDirection,
  heading,
}: CompassProps): React.JSX.Element {
  const relativeDirection = getRelativeQiblaDirection({
    qiblaDirection,
    heading,
  });
  const dialRotation = heading === null ? 0 : -heading;
  const { width } = useWindowDimensions();
  const compassSize = Math.min(width * 0.86, 348);
  const glowSize = compassSize * 0.9;

  return (
    <View style={[styles.wrap, { width: compassSize, height: compassSize }]}>
      <View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
          },
        ]}
      />
      <Svg width={compassSize} height={compassSize} viewBox="0 0 312 312">
        <Defs>
          <LinearGradient
            id="qiblaNeedle"
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2={QIBLA_BAR_TOP}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.2" />
            <Stop offset="0.72" stopColor={colors.primary} stopOpacity="0.72" />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="148"
          fill={colors.surfaceLowest}
          stroke={colors.surfaceVariant}
          strokeWidth="1.4"
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="142"
          fill={colors.primary}
          opacity="0.035"
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="145"
          fill="none"
          stroke={colors.surfaceLowest}
          strokeWidth="3"
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="142"
          fill="none"
          stroke={colors.surfaceVariant}
          strokeWidth="1.2"
        />
        <G rotation={dialRotation} origin={`${CENTER},${CENTER}`}>
          <DirectionLabel label="N" x={CENTER} y={29} />
          <DirectionLabel label="E" x={286} y={162} />
          <DirectionLabel label="S" x={CENTER} y={295} />
          <DirectionLabel label="W" x={26} y={162} />
        </G>
        <G rotation={relativeDirection} origin={`${CENTER},${CENTER}`}>
          <Path
            d={`M${CENTER} 37 C${CENTER - 2} 38 ${CENTER - 4} 40 ${CENTER - 6} 44 L${CENTER - 14} 59 C${CENTER - 16} 62 ${CENTER - 14} 65 ${CENTER - 10} 64 C${CENTER - 5} 62 ${CENTER - 2} 61 ${CENTER} 61 C${CENTER + 2} 61 ${CENTER + 5} 62 ${CENTER + 10} 64 C${CENTER + 14} 65 ${CENTER + 16} 62 ${CENTER + 14} 59 L${CENTER + 6} 44 C${CENTER + 4} 40 ${CENTER + 2} 38 ${CENTER} 37 Z`}
            fill={colors.primary}
          />
          <Rect
            x={CENTER - QIBLA_BAR_WIDTH / 2}
            y={QIBLA_BAR_TOP}
            width={QIBLA_BAR_WIDTH}
            height={CENTER - QIBLA_BAR_TOP}
            fill="url(#qiblaNeedle)"
          />
        </G>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r="30"
          fill={colors.surface}
          stroke={colors.surfaceVariant}
          strokeWidth="1.5"
        />
        <Circle cx={CENTER} cy={CENTER} r="13" fill={colors.primary} />
      </Svg>
    </View>
  );
}

function DirectionLabel({
  label,
  x,
  y,
}: {
  label: string;
  x: number;
  y: number;
}): React.JSX.Element {
  return (
    <SvgText
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={15}
      fontWeight="700"
      fill={colors.primary}
      opacity="0.28">
      {label}
    </SvgText>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 106, 57, 0.05)',
  },
});
