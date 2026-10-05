module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|react-navigation|@react-navigation|unimodules|sentry-expo|native-base|nativewind))',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest.css-stub.js',
  },
};
