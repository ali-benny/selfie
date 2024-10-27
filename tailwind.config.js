/** @type {import('tailwindcss').Config} */
const { addDynamicIconSelectors } = require('@iconify/tailwind')
import catppuccin from '@catppuccin/daisyui'
import { flavors } from '@catppuccin/palette'
import Color from 'colorjs.io'

const hexToOklch_coords = (hex) => {
  const color = new Color(hex).to('oklch')
  return `${color.coords[0] * 100}% ${color.coords[1]} ${color.coords[2]}`
}

const hexToOklch_css = (hex) => {
  return new Color(hex).to('oklch').toString()
}

const fixCustomTheme = ({
  themeName,
  theme,
  base200 = null,
  base300 = null,
  baseContent = null,
  surface0 = null,
  surface1 = null,
  surface2 = null,
  overlay0 = null,
  overlay1 = null,
  overlay2 = null,
  subtext0 = null,
  subtext1 = null
}) => {
  if (base200) theme[themeName]['base-200'] = hexToOklch_css(base200)
  if (base300) theme[themeName]['base-300'] = hexToOklch_css(base300)
  if (baseContent) theme[themeName]['base-content'] = hexToOklch_css(baseContent)
  if (surface0) theme[themeName]['--surface-0'] = hexToOklch_coords(surface0)
  if (surface1) theme[themeName]['--surface-1'] = hexToOklch_coords(surface1)
  if (surface2) theme[themeName]['--surface-2'] = hexToOklch_coords(surface2)
  if (overlay0) theme[themeName]['--overlay-0'] = hexToOklch_coords(overlay0)
  if (overlay1) theme[themeName]['--overlay-1'] = hexToOklch_coords(overlay1)
  if (overlay2) theme[themeName]['--overlay-2'] = hexToOklch_coords(overlay2)
  if (subtext0) theme[themeName]['--subtext-0'] = hexToOklch_coords(subtext0)
  if (subtext1) theme[themeName]['--subtext-1'] = hexToOklch_coords(subtext1)
  return theme
}

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'oklch(var(--surface-0) / <alpha-value>)',
          1: 'oklch(var(--surface-1) / <alpha-value>)',
          2: 'oklch(var(--surface-2) / <alpha-value>)'
        },
        overlay: {
          0: 'oklch(var(--overlay-0) / <alpha-value>)',
          1: 'oklch(var(--overlay-1) / <alpha-value>)',
          2: 'oklch(var(--overlay-2) / <alpha-value>)'
        },
        subtext: {
          0: 'oklch(var(--subtext-0) / <alpha-value>)',
          1: 'oklch(var(--subtext-1) / <alpha-value>)'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui'), addDynamicIconSelectors()],
  daisyui: {
    themes: [
      fixCustomTheme({
        themeName: 'macchiato',
        theme: catppuccin('macchiato', {
          primary: 'blue',
          secondary: 'sky',
          accent: 'pink'
        }),
        base200: flavors.macchiato.colors.mantle.hex,
        base300: flavors.macchiato.colors.crust.hex,
        baseContent: flavors.macchiato.colors.text.hex,
        surface0: flavors.macchiato.colors.surface0.hex,
        surface1: flavors.macchiato.colors.surface1.hex,
        surface2: flavors.macchiato.colors.surface2.hex,
        overlay0: flavors.macchiato.colors.overlay0.hex,
        overlay1: flavors.macchiato.colors.overlay1.hex,
        overlay2: flavors.macchiato.colors.overlay2.hex,
        subtext0: flavors.macchiato.colors.subtext0.hex,
        subtext1: flavors.macchiato.colors.subtext1.hex
      })
    ]
  }
}
