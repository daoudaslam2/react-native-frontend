import React, { useEffect } from 'react';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProviders } from './src/providers/AppProviders';
import { prepareLocalDatabase } from './src/database/database';

function App(): React.JSX.Element {
  useEffect(() => {
    prepareLocalDatabase().catch(error => {
      if (__DEV__) {
        console.warn('Unable to prepare local database:', error);
      }
    });
  }, []);

  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}

export default App;
