import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { fr } from 'vuetify/locale'

// Rouge HEIG-VD sur des neutres gris. Le thème sombre éclaircit le rouge pour garder le contraste.
const light = {
  dark: false,
  colors: {
    background: '#f6f7f9',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    'surface-light': '#f0f2f5',
    'surface-variant': '#343a44',
    'on-surface-variant': '#f3f4f6',
    'on-background': '#1d222b',
    'on-surface': '#1d222b',
    // Rouge HEIG-VD adouci : réservé aux actions principales et à la sélection.
    primary: '#bf2a3c',
    'primary-darken-1': '#9e2232',
    secondary: '#4a5261',
    'secondary-darken-1': '#363c48',
    error: '#b03a3a',
    info: '#3a679c',
    success: '#2f7a52',
    warning: '#94610f',
    neutral: '#5d6370',
  },
  variables: {
    'border-color': '#1d222b',
    'border-opacity': 0.1,
    'medium-emphasis-opacity': 0.66,
    'hover-opacity': 0.035,
    'theme-code': '#f0f2f5',
  },
}

const dark = {
  dark: true,
  colors: {
    background: '#14171c',
    surface: '#1b1f26',
    'surface-bright': '#262b33',
    'surface-light': '#232830',
    'surface-variant': '#d5d9e0',
    'on-surface-variant': '#1b1f26',
    'on-background': '#e6e8ec',
    'on-surface': '#e6e8ec',
    primary: '#f08a94',
    'on-primary': '#2a0a0f',
    'primary-darken-1': '#e46e7a',
    secondary: '#b4bbc8',
    'on-secondary': '#14171c',
    error: '#f19a95',
    'on-error': '#2a0a08',
    info: '#9cbde6',
    'on-info': '#0c1d33',
    success: '#8fcfa9',
    'on-success': '#0b2416',
    warning: '#e3bf7c',
    'on-warning': '#2b1d05',
    neutral: '#aeb4bf',
  },
  variables: {
    'border-color': '#ffffff',
    'border-opacity': 0.12,
    'medium-emphasis-opacity': 0.72,
    'theme-code': '#232830',
  },
}

export function initialThemeName() {
  try {
    const saved = window.localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* stockage indisponible */
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default createVuetify({
  locale: { locale: 'fr', messages: { fr } },
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: { defaultTheme: initialThemeName(), themes: { light, dark } },
  defaults: {
    VBtn: { class: 'text-none', rounded: 'lg', style: 'letter-spacing: 0' },
    VCard: { rounded: 'lg', elevation: 0 },
    VChip: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSwitch: { color: 'primary', density: 'compact', hideDetails: true },
    VCheckbox: { color: 'primary', density: 'compact', hideDetails: true },
    VTooltip: { location: 'bottom', openDelay: 250 },
    VDialog: { scrollable: true },
    VAlert: { rounded: 'lg' },
    VTab: { class: 'text-none', style: 'letter-spacing: 0' },
  },
})
