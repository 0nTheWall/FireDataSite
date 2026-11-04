/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Warm dark mode ──────────────────────────────────────────────
        // The whole UI is dark with warm (brown/amber-leaning) neutrals.
        // We remap the tokens the app already uses so every surface flips
        // at once:
        //   - "white"      → warm elevated card surface (not actually white)
        //   - "slate" 50…  → warm light text; "slate" 800/900 would be dark,
        //                     but the app mostly uses slate for TEXT, so the
        //                     low numbers are the lightest. We invert the
        //                     ramp: low index = bright text, high index =
        //                     warm dark surfaces (bg-slate-50/100).
        white: '#2a2320', // card / elevated surface (warm charcoal-brown)

        slate: {
          50: '#2f2622', // warm dark surface (used as bg-slate-50)
          100: '#3a302a', // slightly lighter warm surface (bg-slate-100)
          200: '#4a3d35', // warm borders (border-slate-200)
          300: '#5a4a40', // input borders (border-slate-300)
          400: '#b8a898', // muted warm text
          500: '#cdbcac', // secondary warm text
          600: '#ddcdbd', // body-ish warm text
          700: '#ece0d2', // strong warm text
          800: '#f5ecdf', // headings-ish
          900: '#fbf5ec', // brightest headings (text-slate-900)
        },

        // Forest-green accent, brightened for contrast on dark surfaces.
        forest: {
          50: '#223a2b', // tinted dark surface for green badges
          100: '#2b4a37',
          600: '#4caf6d', // primary accent (buttons)
          700: '#3f9a5d', // hover
          800: '#9fe0b3', // green text on dark
        },

        // Amber for incomplete / needs-attention items (warm, central to theme).
        warn: {
          50: '#3d2f16', // tinted dark surface for amber badges
          100: '#4a3a1c',
          600: '#f0a93a', // amber accent
          700: '#f5c56b', // amber text on dark
        },

        // Red/ember for urgent items.
        urgent: {
          50: '#3d1f1c', // tinted dark surface for red badges
          100: '#4d2420',
          600: '#ef5350', // urgent accent
          700: '#ff8a80', // urgent text on dark
        },
      },
    },
  },
  plugins: [],
}
