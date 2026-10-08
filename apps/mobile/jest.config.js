module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/App.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|@react-native-async-storage))',
  ],
  moduleNameMapper: {
    '^react-native-safe-area-context$': '<rootDir>/jest/rn-safe-area-context-mock.js',
    // Node's resolver would pick lucide-react-native's "react-native" export condition,
    // an untranspiled .mjs file that jest's transform doesn't cover; map straight to the
    // package's own CJS build instead.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
};
