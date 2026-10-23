/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F172A',
        'bg-secondary': '#1E293B',
        'bg-elevated': '#293548',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'primary': '#F59E0B',
        'primary-hover': '#FBBF24',
        'secondary': '#DC2626',
        'secondary-hover': '#EF4444',
        'success': '#22C55E',
        'error': '#DC2626',
        'warning': '#F59E0B',
        'info': '#2563EB',
        'border': '#334155',
        'border-focus': '#F59E0B',
        'player-1': '#3B82F6',
        'player-2': '#EF4444',
        'player-3': '#22C55E',
        'player-4': '#F59E0B',
        'player-5': '#A855F7',
        'player-6': '#EC4899',
        'player-7': '#06B6D4',
        'player-8': '#F97316',
      },
      fontFamily: {
        display: ['Righteous', 'cursive'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
