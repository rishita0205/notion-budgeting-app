/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e1fd',
          300: '#c2d1fc',
          400: '#adc2fb',
          500: '#99b3fa',
          600: '#85a3f9',
          700: '#7094f8',
          800: '#5c85f7',
          900: '#4775f6',
        },
      },
    },
  },
  plugins: [],
};

