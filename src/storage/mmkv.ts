import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

interface StringStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => boolean;
}

const memory = new Map<string, string>();

const fallbackStorage: StringStorage = {
  getString: key => memory.get(key),
  set: (key, value) => {
    memory.set(key, value);
  },
  remove: key => memory.delete(key),
};

function createLocalStorage(): StringStorage {
  try {
    return createMMKV({ id: 'al-salah-local-storage' });
  } catch {
    return fallbackStorage;
  }
}

const storage = createLocalStorage();

export const localStorage: StateStorage = {
  getItem: name => storage.getString(name) ?? null,
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: name => {
    storage.remove(name);
  },
};
