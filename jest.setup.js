import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Le module natif n'existe pas sous Jest. Mock officiel de la lib, monté ici
// plutôt que suite par suite : AsyncStorage est atteint indirectement, via le
// journal d'auth ou le persister react-query, par des tests qui n'en parlent
// jamais.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    extra: {
      apiUrl: 'https://api.test.com',
    },
  },
}));
