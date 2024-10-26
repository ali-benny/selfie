/** @type {import('tailwindcss').Config} */
import { addDynamicIconSelectors } from '@iconify/tailwind';
import catppuccin from '@catppuccin/daisyui';
import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {}
  },
  plugins: [typography, daisyui, addDynamicIconSelectors()],
  daisyui: {
    themes: [catppuccin('macchiato', { primary: 'blue', secondary: 'sky', accent: 'pink'})]
  }
};