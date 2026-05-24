import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'Space Mono', 'monospace'],
        sans: ['var(--font-sans)', 'DM Sans', 'sans-serif'],
      },
      colors: {
        critical: '#ff3366',
        warning: '#ffb020',
        good: '#00e676',
      },
    },
  },
  plugins: [],
}

export default config
