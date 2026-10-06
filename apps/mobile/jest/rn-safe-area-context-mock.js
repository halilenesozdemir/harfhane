const React = require('react');

const DEFAULT_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_FRAME = { x: 0, y: 0, width: 320, height: 640 };

const SafeAreaInsetsContext = React.createContext(DEFAULT_INSETS);
const SafeAreaFrameContext = React.createContext(DEFAULT_FRAME);

function SafeAreaProvider({ children, initialMetrics }) {
  const insets = initialMetrics?.insets ?? DEFAULT_INSETS;
  const frame = initialMetrics?.frame ?? DEFAULT_FRAME;
  return React.createElement(
    SafeAreaFrameContext.Provider,
    { value: frame },
    React.createElement(SafeAreaInsetsContext.Provider, { value: insets }, children),
  );
}

function useSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}

function useSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}

module.exports = {
  SafeAreaProvider,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics: { frame: DEFAULT_FRAME, insets: DEFAULT_INSETS },
};
