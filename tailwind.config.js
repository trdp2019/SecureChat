/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'message-send': 'messageSend 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'message-receive': 'messageReceive 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in-scale': 'fadeInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        messageSend: {
          '0%': { transform: 'scale(0.8) translateX(20px)', opacity: '0' },
          '50%': { transform: 'scale(1.05) translateX(0)', opacity: '0.8' },
          '100%': { transform: 'scale(1) translateX(0)', opacity: '1' },
        },
        messageReceive: {
          '0%': { transform: 'scale(0.8) translateX(-20px)', opacity: '0' },
          '50%': { transform: 'scale(1.05) translateX(0)', opacity: '0.8' },
          '100%': { transform: 'scale(1) translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        bounceGentle: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInScale: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
