import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
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
          <LinearGradient id="qiblaNeedle" x1="156" y1="156" x2="156" y2="52">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.25" />
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
          <DirectionLabel label="N" x={CENTER} y={42} />
          <DirectionLabel label="E" x={273} y={162} />
          <DirectionLabel label="S" x={CENTER} y={282} />
          <DirectionLabel label="W" x={39} y={162} />
        </G>
        <G rotation={relativeDirection} origin={`${CENTER},${CENTER}`}>
          <Line
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2="58"
            stroke="url(#qiblaNeedle)"
            strokeWidth="8"
            strokeLinecap="round"
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
