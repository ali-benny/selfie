/** @type {import('tailwindcss').Config} */
const { addDynamicIconSelectors } = require('@iconify/tailwind')
import catppuccin from '@catppuccin/daisyui'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui'), addDynamicIconSelectors()],
  daisyui: {
    themes: [catppuccin('macchiato', { primary: 'blue' })]
  }
}
