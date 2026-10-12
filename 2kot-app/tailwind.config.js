/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        foreground: 'var(--foreground)',
        'foreground-secondary': 'var(--foreground-secondary)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        secondary: 'var(--secondary)',
        'secondary-hover': 'var(--secondary-hover)',
        magenta: 'var(--magenta)',
        'magenta-hover': 'var(--magenta-hover)',
        success: 'var(--success)',
        'success-hover': 'var(--success-hover)',
        destructive: 'var(--destructive)',
        'destructive-hover': 'var(--destructive-hover)',
        border: 'var(--border)',
        'border-secondary': 'var(--border-secondary)',
        'border-muted': 'var(--border-muted)',
        ring: 'var(--ring)',
        'ring-offset': 'var(--ring-offset)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
