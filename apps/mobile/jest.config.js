module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/App.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|@react-native-async-storage))',
  ],
  moduleNameMapper: {
    '^react-native-safe-area-context$': '<rootDir>/jest/rn-safe-area-context-mock.js',
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
