/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        correct: 'rgb(var(--hh-correct-rgb) / <alpha-value>)',
        present: 'rgb(var(--hh-present-rgb) / <alpha-value>)',
        absent: 'rgb(var(--hh-absent-rgb) / <alpha-value>)',
        brand: 'rgb(var(--hh-brand-rgb) / <alpha-value>)',
        'brand-fg': 'var(--hh-brand-fg)',
        'correct-fg': 'var(--hh-correct-fg)',
        'correct-depth': 'var(--hh-correct-depth)',
        'present-fg': 'var(--hh-present-fg)',
        'present-depth': 'var(--hh-present-depth)',
        'absent-fg': 'var(--hh-absent-fg)',
        'key-fg': 'var(--hh-key-fg)',
        'tile-empty-bg': 'var(--hh-tile-empty-bg)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'tile-empty': 'var(--tile-empty)',
        'tile-filled': 'var(--tile-filled)',
        'key-bg': 'var(--key-bg)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
      },
      fontFamily: {
        display: ['var(--hh-font-display)'],
        body: ['var(--hh-font-body)'],
      },
      borderRadius: {
        tile: 'var(--hh-radius-tile)',
        key: 'var(--hh-radius-key)',
      },
      boxShadow: {
        'depth-correct': '0 4px 0 var(--hh-correct-depth)',
        'depth-present': '0 4px 0 var(--hh-present-depth)',
        'depth-absent': '0 4px 0 var(--hh-absent-depth)',
        'depth-tile': '0 3px 0 var(--hh-tile-empty-border)',
        'depth-key': '0 3px 0 var(--hh-key-depth)',
        'depth-surface': '0 4px 0 var(--hh-surface-depth)',
        'depth-brand': '0 4px 0 var(--hh-brand-depth)',
      },
      animation: {
        'pop': 'pop 0.1s ease-in-out',
        'flip': 'flip 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounce-in 0.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'confetti-fall': 'confetti-fall 1.6s ease-in forwards',
      },
      keyframes: {
        'confetti-fall': {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
