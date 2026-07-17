import type { Config } from 'tailwindcss';

export default {
  content: ['./client/index.html', './client/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override default Tailwind colors to use HSL instead of oklch
        slate: {
          50: 'hsl(215 100% 98%)',
          100: 'hsl(215 100% 96%)',
          200: 'hsl(214 95% 93%)',
          300: 'hsl(213 96% 87%)',
          400: 'hsl(215 84% 75%)',
          500: 'hsl(215 70% 65%)',
          600: 'hsl(215 77% 56%)',
          700: 'hsl(215 88% 40%)',
          800: 'hsl(217 33% 17%)',
          900: 'hsl(222 47% 11%)',
          950: 'hsl(228 29% 10%)',
        },
        white: '#ffffff',
        black: '#000000',
      },
    },
  },
  plugins: [],
} satisfies Config;
