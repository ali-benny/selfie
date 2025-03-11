import globals from 'globals'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: {
      '@stylistic': stylistic
    }
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential']
]
