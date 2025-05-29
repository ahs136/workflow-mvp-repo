import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'secondary': '#6366f1',
        'text': '#333333',
        'bg-light': '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 15px 40px rgba(0, 0, 0, 0.08)',
        'nav': '0 2px 15px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '0.5'
          },
          '50%': { 
            transform: 'scale(1.5)',
            opacity: '0.8'
          },
        },
      },
      animation: {
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config; 