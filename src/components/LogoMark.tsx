import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
  inverse?: boolean;
}

export function LogoMark({
  size = 112,
  inverse = false,
}: LogoMarkProps): React.JSX.Element {
  const shell = inverse ? '#ffffff' : '#006a39';
  const accent = inverse ? '#ffe088' : '#cca72f';
  const inner = inverse ? '#006a39' : '#ffffff';

  return (
    <Svg width={size} height={size} viewBox="0 0 128 128">
      <Defs>
        <LinearGradient id="logo-gradient" x1="20" y1="12" x2="108" y2="116">
          <Stop offset="0" stopColor={shell} stopOpacity="1" />
          <Stop offset="1" stopColor={inverse ? '#afefdd' : '#29695b'} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle cx="64" cy="64" r="58" fill="url(#logo-gradient)" />
      <Circle cx="64" cy="64" r="46" fill={inner} opacity={inverse ? 0.16 : 0.94} />
      <G fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M36 82c10-22 21-35 28-39 7 4 18 17 28 39" strokeWidth="6" />
        <Path d="M45 82h38" strokeWidth="6" />
        <Path d="M64 36v12" strokeWidth="5" />
        <Path d="M57 43h14" strokeWidth="5" />
      </G>
    </Svg>
  );
}
