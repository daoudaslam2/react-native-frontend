import React, { useEffect, useState } from 'react';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProviders } from './src/providers/AppProviders';
import { prepareLocalDatabase } from './src/database/database';
import { SplashScreen } from './src/features/home/SplashScreen';

function App(): React.JSX.Element {
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    prepareLocalDatabase().catch(error => {
      if (__DEV__) {
        console.warn('Unable to prepare local database:', error);
      }
    });

    const timeout = setTimeout(() => {
      setSplashVisible(false);
    }, 1600);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AppProviders>
      {isSplashVisible ? <SplashScreen /> : <AppNavigator />}
    </AppProviders>
  );
}

export default App;
