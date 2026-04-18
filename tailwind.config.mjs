/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,svelte,vue}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
      },
    },
  },
  corePlugins: {
    // preflight is disabled so Tailwind's base reset doesn't clash with the
    // existing hand-rolled global.css. Remove this once you migrate sections
    // of global.css over to utility classes.
    preflight: false,
  },
  plugins: [],
};
