/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Primary - Neon Blue (Future & Trust)
        primary: {
          DEFAULT: '#00F0FF',
          light: '#5CFFFF',
          dark: '#00B8CC',
          foreground: '#000000',
        },
        // Secondary - Electric Lime (Energy & Fun)
        secondary: {
          DEFAULT: '#CCFF00',
          light: '#E5FF66',
          dark: '#99CC00',
          foreground: '#000000',
        },
        // Accent - Hot Pink (Excitement)
        accent: {
          DEFAULT: '#FF0099',
          light: '#FF66CC',
          dark: '#CC007A',
          foreground: '#FFFFFF',
        },
        // Background - Deep Purple (Immersive)
        background: {
          DEFAULT: '#1A0B2E',
          light: '#2D1B4E',
          dark: '#0D0518',
          paper: '#251042',
        },
        // Surface Colors
        surface: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Functional
        success: '#00FF94',
        warning: '#FFD600',
        error: '#FF0055',
        info: '#00F0FF',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        fun: ['Fredoka', 'cursive'],
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3rem',
        'blob': '40% 60% 70% 30% / 40% 50% 60% 50%',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-lime': '0 0 20px rgba(204, 255, 0, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 153, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 7s infinite',
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' },
          '50%': { opacity: '0.5', boxShadow: '0 0 40px rgba(0, 240, 255, 0.8)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },
    },
  },
  plugins: [],
};
