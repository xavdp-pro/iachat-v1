import { create } from 'zustand'
import api from '../api/index.js'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: true,

  // Initialize from stored token
  init: async () => {
    const token = localStorage.getItem('token')
    if (!token) return set({ loading: false })
    try {
      const user = await api.get('/auth/me')
      set({ user, token, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', token)
    set({ token, user })
    return user
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
