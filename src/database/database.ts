import { open } from 'react-native-nitro-sqlite';

export async function prepareLocalDatabase(): Promise<void> {
  try {
    const database = open({ name: 'al_salah.db' });

    await database.executeAsync(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  } catch (error) {
    if (__DEV__) {
      console.warn('SQLite initialization skipped:', error);
    }
  }
}

export async function clearLocalDatabase(): Promise<void> {
  try {
    const database = open({ name: 'al_salah.db' });

    await database.executeAsync('DELETE FROM app_metadata;');
  } catch (error) {
    if (__DEV__) {
      console.warn('SQLite reset skipped:', error);
    }
  }
}
