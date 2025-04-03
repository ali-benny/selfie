import { defineStore } from 'pinia'
import { SCREENS } from '@/const.js'
import { useMediaQuery } from '@vueuse/core'

const mediaQueryString = (value) => `(min-width: ${value})`

export const useScreens = defineStore('screens', () => {
  const isSmallScreen = useMediaQuery(mediaQueryString(SCREENS.sm))
  const isMediumScreen = useMediaQuery(mediaQueryString(SCREENS.md))
  const isLargeScreen = useMediaQuery(mediaQueryString(SCREENS.lg))
  const isExtraLargeScreen = useMediaQuery(mediaQueryString(SCREENS.xl))
  const isDoubleExtraLargeScreen = useMediaQuery(mediaQueryString(SCREENS['2xl']))

  return {
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isExtraLargeScreen,
    isDoubleExtraLargeScreen
  }
})
