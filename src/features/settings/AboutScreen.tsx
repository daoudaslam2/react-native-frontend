import React from 'react';

import {
  SettingsContentBlock,
  SettingsBullet,
  SettingsParagraph,
} from './SettingsContentBlock';
import { SettingsDetailScaffold } from './SettingsDetailScaffold';

export function AboutScreen(): React.JSX.Element {
  return (
    <SettingsDetailScaffold
      title="About Al-Salah"
      subtitle="A modern, privacy-first Islamic prayer companion built for daily use.">
      <SettingsContentBlock title="Al-Salah">
        <SettingsParagraph>
          Al-Salah helps you follow prayer times, Qibla direction, Qaza counts,
          and prayer tracking from a minimal offline-first app.
        </SettingsParagraph>
      </SettingsContentBlock>

      <SettingsContentBlock title="Current features">
        <SettingsBullet>Offline prayer time calculation.</SettingsBullet>
        <SettingsBullet>Current prayer, next prayer, and remaining time.</SettingsBullet>
        <SettingsBullet>Qibla direction and Android home screen widgets.</SettingsBullet>
        <SettingsBullet>Prayer tracker and Qaza counter.</SettingsBullet>
        <SettingsBullet>Calculation method, Asr method, and Isha end-time settings.</SettingsBullet>
      </SettingsContentBlock>

      <SettingsContentBlock title="Design principles">
        <SettingsBullet>Offline first.</SettingsBullet>
        <SettingsBullet>Fast, minimal, and calm.</SettingsBullet>
        <SettingsBullet>Private by default.</SettingsBullet>
        <SettingsBullet>No backend required for core use.</SettingsBullet>
      </SettingsContentBlock>

      <SettingsContentBlock title="Version">
        <SettingsParagraph>Version 0.1.0</SettingsParagraph>
      </SettingsContentBlock>
    </SettingsDetailScaffold>
  );
}
