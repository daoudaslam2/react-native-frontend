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
