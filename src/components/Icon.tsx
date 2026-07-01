import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect,
} from 'react-native-svg';

import { NamazTabIcon } from './icons/NamazTabIcon';

export type IconName =
  | 'add'
  | 'arrowLeft'
  | 'bell'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'checkCircle'
  | 'chevronRight'
  | 'close'
  | 'cloud'
  | 'compass'
  | 'editList'
  | 'eye'
  | 'eyeOff'
  | 'fire'
  | 'home'
  | 'info'
  | 'language'
  | 'location'
  | 'logout'
  | 'menu'
  | 'minus'
  | 'minusOneCheck'
  | 'moon'
  | 'mosque'
  | 'namaz'
  | 'palette'
  | 'qibla'
  | 'rotate'
  | 'shield'
  | 'settings'
  | 'sun'
  | 'task'
  | 'timer'
  | 'widgets';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function Icon({
  name,
  size = 24,
  color = '#1b1c19',
  filled = false,
}: IconProps): React.JSX.Element {
  if (name === 'namaz') {
    return <NamazTabIcon color={color} selected={filled} size={size} />;
  }

  const strokeProps = {
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const fillColor = filled ? color : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderIcon(name, strokeProps, color, fillColor, filled)}
    </Svg>
  );
}

function renderIcon(
  name: IconName,
  strokeProps: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: string;
  },
  color: string,
  fillColor: string,
  filled: boolean,
): React.ReactNode {
  switch (name) {
    case 'add':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...strokeProps} />
          <Line x1="5" y1="12" x2="19" y2="12" {...strokeProps} />
        </>
      );
    case 'arrowLeft':
      return (
        <>
          <Line x1="19" y1="12" x2="5" y2="12" {...strokeProps} />
          <Polyline points="12 5 5 12 12 19" {...strokeProps} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...strokeProps} />
          <Path d="M10 21h4" {...strokeProps} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x="4" y="5" width="16" height="15" rx="3" {...strokeProps} />
          <Line x1="8" y1="3" x2="8" y2="7" {...strokeProps} />
          <Line x1="16" y1="3" x2="16" y2="7" {...strokeProps} />
          <Line x1="4" y1="10" x2="20" y2="10" {...strokeProps} />
        </>
      );
    case 'chart':
      return (
        <>
          <Line x1="5" y1="19" x2="5" y2="11" {...strokeProps} />
          <Line x1="12" y1="19" x2="12" y2="5" {...strokeProps} />
          <Line x1="19" y1="19" x2="19" y2="9" {...strokeProps} />
        </>
      );
    case 'check':
      return <Polyline points="5 13 10 18 20 7" {...strokeProps} />;
    case 'checkCircle':
      return (
        <>
          <Circle cx="12" cy="12" r="9" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Polyline points="7.5 12 10.5 15 16.5 9" stroke={filled ? '#ffffff' : color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case 'chevronRight':
      return <Polyline points="9 6 15 12 9 18" {...strokeProps} />;
    case 'close':
      return (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...strokeProps} />
          <Line x1="18" y1="6" x2="6" y2="18" {...strokeProps} />
        </>
      );
    case 'cloud':
      return <Path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 18Z" {...strokeProps} />;
    case 'compass':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...strokeProps} />
          <Path d="M15.5 8.5 13.7 13.7 8.5 15.5l1.8-5.2 5.2-1.8Z" fill={fillColor} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'editList':
      return (
        <>
          <Line x1="4" y1="7" x2="14" y2="7" {...strokeProps} />
          <Line x1="4" y1="12" x2="12" y2="12" {...strokeProps} />
          <Line x1="4" y1="17" x2="9" y2="17" {...strokeProps} />
          <Path d="M14.5 18.5 20 13l-2.5-2.5-5.5 5.5-.7 3.2 3.2-.7Z" fill={fillColor} stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M3.5 12s3-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3 5.5-8.5 5.5S3.5 12 3.5 12Z" {...strokeProps} />
          <Circle cx="12" cy="12" r="2.4" {...strokeProps} />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <Path d="M4 4 20 20" {...strokeProps} />
          <Path d="M9.3 6.9A8.2 8.2 0 0 1 12 6.5c5.5 0 8.5 5.5 8.5 5.5a15 15 0 0 1-2.2 2.8" {...strokeProps} />
          <Path d="M14 17.2a8.6 8.6 0 0 1-2 .3C6.5 17.5 3.5 12 3.5 12a14.7 14.7 0 0 1 3-3.5" {...strokeProps} />
        </>
      );
    case 'fire':
      return <Path d="M12 22c4 0 7-2.8 7-6.7 0-3-1.9-5.2-4.3-7.6-.5 2.1-1.8 3.1-3.1 3.8.6-2.5-.1-5.1-3.1-7.5.2 3.9-3.5 6.5-3.5 11.1C5 19.2 8 22 12 22Z" fill={fillColor} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'home':
      return (
        <>
          <Path d="M4 11.5 12 5l8 6.5" {...strokeProps} />
          <Path d="M6.5 10.5V20h11V10.5" {...strokeProps} />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...strokeProps} />
          <Line x1="12" y1="11" x2="12" y2="16" {...strokeProps} />
          <Line x1="12" y1="8" x2="12.01" y2="8" {...strokeProps} />
        </>
      );
    case 'language':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...strokeProps} />
          <Path d="M3 12h18" {...strokeProps} />
          <Path d="M12 3c2.3 2.4 3.5 5.4 3.5 9S14.3 18.6 12 21c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" {...strokeProps} />
        </>
      );
    case 'location':
      return (
        <>
          <Path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0Z" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Circle cx="12" cy="10" r="2.4" fill={filled ? '#ffffff' : 'none'} stroke={filled ? '#ffffff' : color} strokeWidth="1.7" />
        </>
      );
    case 'logout':
      return (
        <>
          <Path d="M9.5 5H6.8A2.8 2.8 0 0 0 4 7.8v8.4A2.8 2.8 0 0 0 6.8 19h2.7" {...strokeProps} />
          <Line x1="10" y1="12" x2="20" y2="12" {...strokeProps} />
          <Polyline points="16 8 20 12 16 16" {...strokeProps} />
        </>
      );
    case 'menu':
      return (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" {...strokeProps} />
          <Line x1="4" y1="12" x2="20" y2="12" {...strokeProps} />
          <Line x1="4" y1="17" x2="20" y2="17" {...strokeProps} />
        </>
      );
    case 'minus':
      return <Line x1="5" y1="12" x2="19" y2="12" {...strokeProps} />;
    case 'minusOneCheck':
      return (
        <>
          <Polyline points="4.5 13 9.5 18 18 8.5" {...strokeProps} />
          <Path
            d="M23.5 9.5V2.8l-2.4 1.4"
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );
    case 'moon':
      return <Path d="M20 15.4A8.2 8.2 0 0 1 8.6 4a8.2 8.2 0 1 0 11.4 11.4Z" fill={fillColor} stroke={color} strokeWidth="1.9" />;
    case 'mosque':
      return (
        <>
          <Path d="M4 20h16" {...strokeProps} />
          <Path d="M6 20v-7a6 6 0 0 1 12 0v7" {...strokeProps} />
          <Path d="M9 20v-5h6v5" {...strokeProps} />
          <Path d="M12 3v3" {...strokeProps} />
          <Path d="M10 5h4" {...strokeProps} />
        </>
      );
    case 'palette':
      return (
        <>
          <Path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.8-2.9 2 2 0 0 1 1.8-2.9H18a6 6 0 0 0 0-12Z" {...strokeProps} />
          <Circle cx="8" cy="10" r="1" fill={color} />
          <Circle cx="11" cy="7.5" r="1" fill={color} />
          <Circle cx="15" cy="8.5" r="1" fill={color} />
        </>
      );
    case 'qibla':
      return (
        <>
          <Path d="M12 3 5 21h14L12 3Z" fill={fillColor} stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
          <Line x1="12" y1="9" x2="12" y2="17" stroke={filled ? '#ffffff' : color} strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case 'rotate':
      return (
        <>
          <Path d="M20 11a8 8 0 1 0-2.3 5.7" {...strokeProps} />
          <Polyline points="20 4 20 11 13 11" {...strokeProps} />
        </>
      );
    case 'shield':
      return <Path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" fill={fillColor} stroke={color} strokeWidth="1.9" strokeLinejoin="round" />;
    case 'settings':
      return (
        <>
          <Circle cx="12" cy="12" r="3" {...strokeProps} />
          <Path
            d="M12 2.8 14.2 4l.5 2.2 2.2.7 2-1.2 2.1 3.6-1.8 1.5a7.6 7.6 0 0 1 0 2.4l1.8 1.5-2.1 3.6-2-1.2-2.2.7-.5 2.2L12 21.2 9.8 20l-.5-2.2-2.2-.7-2 1.2L3 14.7l1.8-1.5a7.6 7.6 0 0 1 0-2.4L3 9.3l2.1-3.6 2 1.2 2.2-.7.5-2.2L12 2.8Z"
            {...strokeProps}
          />
        </>
      );
    case 'sun':
      return (
        <>
          <Circle cx="12" cy="12" r="4" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Line x1="12" y1="2.5" x2="12" y2="5" {...strokeProps} />
          <Line x1="12" y1="19" x2="12" y2="21.5" {...strokeProps} />
          <Line x1="2.5" y1="12" x2="5" y2="12" {...strokeProps} />
          <Line x1="19" y1="12" x2="21.5" y2="12" {...strokeProps} />
        </>
      );
    case 'task':
      return (
        <>
          <Rect x="4" y="4" width="16" height="16" rx="4" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Polyline points="8 12 11 15 16 9" stroke={filled ? '#ffffff' : color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case 'timer':
      return (
        <>
          <Circle cx="12" cy="13" r="8" {...strokeProps} />
          <Line x1="12" y1="13" x2="12" y2="8" {...strokeProps} />
          <Line x1="12" y1="13" x2="16" y2="13" {...strokeProps} />
          <Line x1="9" y1="3" x2="15" y2="3" {...strokeProps} />
        </>
      );
    case 'widgets':
      return (
        <>
          <Rect x="4" y="4" width="7" height="7" rx="2" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Rect x="13" y="4" width="7" height="7" rx="2" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Rect x="4" y="13" width="7" height="7" rx="2" fill={fillColor} stroke={color} strokeWidth="1.9" />
          <Rect x="13" y="13" width="7" height="7" rx="2" fill={fillColor} stroke={color} strokeWidth="1.9" />
        </>
      );
  }
}
