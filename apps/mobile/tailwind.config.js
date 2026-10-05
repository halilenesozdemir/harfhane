const { themes } = require('@harfhane/ui-tokens');

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: themes.light.bg,
        correct: themes.light.correct,
        'correct-fg': themes.light.correctFg,
      },
    },
  },
  plugins: [],
};
