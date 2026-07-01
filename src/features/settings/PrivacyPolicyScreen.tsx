import React from 'react';

import {
  SettingsContentBlock,
  SettingsBullet,
  SettingsParagraph,
} from './SettingsContentBlock';
import { SettingsDetailScaffold } from './SettingsDetailScaffold';

export function PrivacyPolicyScreen(): React.JSX.Element {
  return (
    <SettingsDetailScaffold
      title="Privacy Policy"
      subtitle="Al-Salah is designed to be private by default and fully usable offline.">
      <SettingsContentBlock title="Privacy first">
        <SettingsParagraph>
          Al-Salah calculates prayer times on your device. The app does not need
          an account, internet connection, or external prayer-time API to work.
        </SettingsParagraph>
      </SettingsContentBlock>

      <SettingsContentBlock title="Data stored on your device">
        <SettingsBullet>Name or display name used for the local app experience.</SettingsBullet>
        <SettingsBullet>Prayer location coordinates and timezone.</SettingsBullet>
        <SettingsBullet>Prayer settings such as calculation method and Asr method.</SettingsBullet>
        <SettingsBullet>Prayer tracker, Qaza counts, and notification preferences.</SettingsBullet>
      </SettingsContentBlock>

      <SettingsContentBlock title="Location">
        <SettingsParagraph>
          Location is used to calculate prayer times and Qibla direction. You can
          use device location or enter coordinates manually. Al-Salah does not
          request background location access.
        </SettingsParagraph>
      </SettingsContentBlock>

      <SettingsContentBlock title="Network and accounts">
        <SettingsParagraph>
          The current mobile app is local-only. Backend sync, cloud backup, and
          account-based restore are not active yet. If cloud features are added,
          they should be optional and clearly shown before data is synced.
        </SettingsParagraph>
      </SettingsContentBlock>

      <SettingsContentBlock title="Your control">
        <SettingsParagraph>
          You can update your location and prayer settings from Settings. Local
          app data can also be removed by clearing app storage or uninstalling
          the app from Android.
        </SettingsParagraph>
      </SettingsContentBlock>
    </SettingsDetailScaffold>
  );
}
