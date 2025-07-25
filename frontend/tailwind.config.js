/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  // Combines content paths from all configurations
  content: [
    './index.html',
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  prefix: "", // Retained from the first configuration
  theme: {
    container: { // Retained from the first configuration
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Base colors (from CSS variables - common to all)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Fixed vibrant colors for gradients and specific uses
        'teal-300': '#5EEAD4', // From second/third config
        'teal-400': '#2DD4BF', // From first config (unique teal)
        'teal-500': '#14B8A6', // From second/third config
        'green-300': '#86EFAC', // From second/third config
        'green-400': '#4ADE80', // Added from user's request
        'green-500': '#22C55E', // From second/third config
        'blue-300': '#93C5FD', // From second/third config
        'blue-400': '#60A5FA', // Added from user's request
        'blue-500': '#3B82F6', // Common, retained from second/third for consistency
        'blue-600': '#2563EB', // Common, retained from second/third for consistency
        'blue-700': '#1D4ED8', // Common, retained from second/third for consistency
        'yellow-300': '#FDE047', // From second/third config
        'yellow-500': '#F59E0B', // Common, retained from second/third for consistency
        'yellow-700': '#B45309', // Common, retained from second/third for consistency
        'purple-500': '#A855F7', // Common, retained from second/third for consistency
        'purple-700': '#7E22CE', // Common, retained from second/third for consistency

        // Custom variables (from first config)
        'seller-accent': 'var(--seller-accent)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Common
        inter: ['Inter', 'sans-serif'], // Added from user's request
      },
      borderRadius: { // Retained from the first configuration
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Keyframes from first config
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        // Keyframes common to all configs (definitions are identical)
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Keyframes from second/third config
        "flow-background": { // A more subtle, ever-changing background gradient
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float-spin": { // Float and subtle spin
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-15px) rotate(5deg)" },
          "75%": { transform: "translateY(15px) rotate(-5deg)" },
        },
        "float-bounce": { // Float with a slight bounce
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-spin-reverse": { // Float and spin in reverse
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(15px) rotate(-5deg)" },
          "75%": { transform: "translateY(-15px) rotate(5deg)" },
        },
        "pulse-icon": { // Subtle pulse for icons
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        'pulse-icon-subtle': { // Added from user's request
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'bounce-subtle': { // Added from user's request
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-slow': { // Added from user's request
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'pulse-delay': { // Added from user's request
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      animation: {
        // Animations from first config
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blob": "blob 10s infinite ease-in-out",
        // Animations common to all configs (definitions are identical)
        "fade-in-up": "fade-in-up 1s ease-out forwards",
        "slide-in-up": "slide-in-up 1s ease-out forwards",
        // Animations from second/third config
        "flow-background": "flow-background 20s ease-in-out infinite", // Slower, more organic
        "float-spin": "float-spin 8s ease-in-out infinite",
        "float-bounce": "float-bounce 6s ease-in-out infinite",
        "float-spin-reverse": "float-spin-reverse 9s ease-in-out infinite",
        "pulse-icon": "pulse-icon 2s ease-in-out infinite",
        'pulse-icon-subtle': 'pulse-icon-subtle 2s ease-in-out infinite', // Added from user's request
        'bounce-subtle': 'bounce-subtle 4s infinite ease-in-out', // Added from user's request
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', // Added from user's request
        'pulse-delay': 'pulse-delay 4s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s', // Added from user's request
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Retained tailwindcss-animate
    function ({ addUtilities }) { // Added text-shadow plugin from user's request
      const newUtilities = {
        '.text-shadow-lg': {
          'text-shadow': '2px 2px 4px rgba(0, 0, 0, 0.2)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
