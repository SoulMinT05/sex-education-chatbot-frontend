import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
const config = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    plugins: [typography],
};

export default config;
