import { create } from 'zustand'
import api from '../api/index.js'

export const useThemeStore = create((set, get) => ({
  skins: [],
  activeSkin: localStorage.getItem('skin') || 'default',
  darkMode: localStorage.getItem('darkMode') === 'true',
  skinLinkEl: null,

  // Load available skins from API
  fetchSkins: async () => {
    try {
      const skins = await api.get('/skins')
      set({ skins })
    } catch {
      set({ skins: [] })
    }
  },

  // Apply a skin by injecting its CSS into <head>
  applySkin: (slug) => {
    const existing = document.getElementById('iachat-skin')
    if (existing) existing.remove()

    const link = document.createElement('link')
    link.id = 'iachat-skin'
    link.rel = 'stylesheet'
    const ts = Date.now()
    link.href = `/api/skins/${slug}/theme.css?t=${ts}`
    document.head.appendChild(link)

    localStorage.setItem('skin', slug)
    set({ activeSkin: slug })
  },

  // Toggle dark / light mode
  toggleDarkMode: () => {
    const next = !get().darkMode
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(next))
    set({ darkMode: next })
  },

  // Init both skin and dark mode on app load
  init: () => {
    const { activeSkin, darkMode } = get()
    // Apply dark mode
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    // Apply skin CSS
    const existing = document.getElementById('iachat-skin')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.id = 'iachat-skin'
    link.rel = 'stylesheet'
    const ts = Date.now()
    link.href = `/api/skins/${activeSkin}/theme.css?t=${ts}`
    document.head.appendChild(link)
  },
}))
