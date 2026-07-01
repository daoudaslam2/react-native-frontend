/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  const createAnimationBuilder = () => {
    const builder = {
      delay: jest.fn(() => builder),
      duration: jest.fn(() => builder),
    };

    return builder;
  };

  return {
    __esModule: true,
    default: {
      View,
    },
    FadeIn: createAnimationBuilder(),
    FadeInDown: createAnimationBuilder(),
    FadeInUp: createAnimationBuilder(),
  };
});

jest.mock('react-native-mmkv', () => {
  const memory = new Map();

  return {
    createMMKV: () => ({
      getString: key => memory.get(key),
      set: (key, value) => {
        memory.set(key, value);
      },
      remove: key => memory.delete(key),
    }),
  };
});

jest.mock('react-native-nitro-sqlite', () => ({
  open: () => ({
    executeAsync: jest.fn().mockResolvedValue({ rows: { length: 0 } }),
  }),
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    },
  },
  RESULTS: {
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    UNAVAILABLE: 'unavailable',
  },
  check: jest.fn().mockResolvedValue('denied'),
  request: jest.fn().mockResolvedValue('denied'),
}));
