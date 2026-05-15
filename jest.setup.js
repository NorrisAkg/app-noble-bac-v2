import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'https://api.test.com',
    },
  },
}));
