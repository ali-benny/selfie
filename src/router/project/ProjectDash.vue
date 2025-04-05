<template>
  <g-gantt-chart
    chart-start="2021-07-12 12:00"
    chart-end="2021-07-13 12:00"
    precision="hour"
    bar-start="myBeginDate"
    bar-end="myEndDate"
	:color-scheme="catppuccin_schema"
  >
    <g-gantt-row label="My row 1" :bars="row1BarList" />
    <g-gantt-row label="My row 2" :bars="row2BarList" />
  </g-gantt-chart>
</template>

<script setup>
import { ref } from 'vue'
import { flavors } from '@catppuccin/palette'

const themeColors = flavors.macchiato.colors

const catppuccin_schema = {
	primary: themeColors.surface0.hex,
	secondary: themeColors.surface2.hex,
	ternary: themeColors.base.hex,
	quartenary: themeColors.mantle.hex,
	hoverHighlight: themeColors.pink.hex,
	markerCurrentTime: themeColors.lavender.hex,
	text: themeColors.text.hex,
	background: themeColors.crust.hex,
	toast: themeColors.red.hex
}

const row1BarList = ref([
  {
    myBeginDate: '2021-07-13 13:00',
    myEndDate: '2021-07-13 19:00',
    ganttBarConfig: {
      // each bar must have a nested ganttBarConfig object ...
      id: 'unique-id-1', // ... and a unique "id" property
      label: 'Lorem ipsum dolor'
    }
  }
])
const row2BarList = ref([
  {
    myBeginDate: '2021-07-13 00:00',
    myEndDate: '2021-07-14 02:00',
    ganttBarConfig: {
      id: 'another-unique-id-2',
      hasHandles: true,
      label: 'Hey, look at me'
    }
  }
])
</script>
