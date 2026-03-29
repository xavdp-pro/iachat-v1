import { create } from 'zustand'
import api from '../api/index.js'

const ACTIVE_PROJECT_KEY = 'iachat_active_project_id'

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  discussions: [],
  activeDiscussion: null,
  messages: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    try {
      const data = await api.get('/projects')
      const savedId = localStorage.getItem(ACTIVE_PROJECT_KEY)
      let activeProject = get().activeProject
      if (activeProject) {
        activeProject = data.find((p) => p.id === activeProject.id) || null
      }
      if (!activeProject && savedId) {
        const id = Number(savedId)
        activeProject = data.find((p) => p.id === id) || null
      }
      // Intentionally no auto-select of the first project (user chooses or creates)

      set({ projects: data, loading: false, activeProject })
      if (activeProject) {
        await get().fetchDiscussions(activeProject.id)
      } else {
        set({ discussions: [], activeDiscussion: null, messages: [] })
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      set({ loading: false })
    }
  },

  setActiveProject: async (project) => {
    if (project) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, String(project.id))
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    set({ activeProject: project, activeDiscussion: null, discussions: [], messages: [] })
    if (project) {
      get().fetchDiscussions(project.id)
    }
  },

  fetchDiscussions: async (projectId) => {
    set({ loading: true })
    try {
      const data = await api.get(`/discussions?project_id=${projectId}`)
      set({ discussions: data, loading: false })
    } catch (err) {
      console.error('Error fetching discussions:', err)
      set({ loading: false })
    }
  },

  createProject: async (name, description) => {
    try {
      const data = await api.post('/projects', { name, description })
      set((state) => ({ projects: [data, ...state.projects] }))
      get().setActiveProject(data)
      return data
    } catch (err) {
      console.error('Error creating project:', err)
      throw err
    }
  },

  updateProject: async (id, payload) => {
    const data = await api.put(`/projects/${id}`, payload)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      activeProject:
        state.activeProject?.id === id ? { ...state.activeProject, ...data } : state.activeProject,
    }))
    return data
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`)
    const wasActive = get().activeProject?.id === id
    if (wasActive) localStorage.removeItem(ACTIVE_PROJECT_KEY)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: wasActive ? null : state.activeProject,
      discussions: wasActive ? [] : state.discussions,
      activeDiscussion: wasActive ? null : state.activeDiscussion,
      messages: wasActive ? [] : state.messages,
    }))
  },

  createDiscussion: async (title) => {
    const { activeProject } = get()
    if (!activeProject) return
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Untitled'
    try {
      const data = await api.post('/discussions', {
        title: safeTitle,
        project_id: activeProject.id,
      })
      set((state) => ({
        discussions: [data, ...state.discussions],
        activeDiscussion: data,
      }))
      return data
    } catch (err) {
      console.error('Error creating discussion:', err)
      throw err
    }
  },

  updateDiscussion: async (id, title) => {
    const trimmed = typeof title === 'string' ? title.trim() : ''
    if (!trimmed) throw new Error('Title required')
    const data = await api.put(`/discussions/${id}`, { title: trimmed })
    set((state) => ({
      discussions: state.discussions.map((d) => (d.id === id ? { ...d, ...data } : d)),
      activeDiscussion:
        state.activeDiscussion?.id === id ? { ...state.activeDiscussion, ...data } : state.activeDiscussion,
    }))
    return data
  },

  deleteDiscussion: async (id) => {
    await api.delete(`/discussions/${id}`)
    const wasActive = get().activeDiscussion?.id === id
    set((state) => ({
      discussions: state.discussions.filter((d) => d.id !== id),
      activeDiscussion: wasActive ? null : state.activeDiscussion,
      messages: wasActive ? [] : state.messages,
    }))
  },

  setActiveDiscussion: async (discussion) => {
    set({ activeDiscussion: discussion, messages: [] })
    if (discussion) {
      get().fetchMessages(discussion.id)
    }
  },

  fetchMessages: async (discussionId) => {
    set({ loading: true })
    try {
      const data = await api.get(`/messages?discussion_id=${discussionId}`)
      set({ messages: data, loading: false })
    } catch (err) {
      console.error('Error fetching messages:', err)
      set({ loading: false })
    }
  },

  updateMessage: async (id, content) => {
    const trimmed = content?.trim()
    if (!trimmed) throw new Error('Content required')
    const data = await api.put(`/messages/${id}`, { content: trimmed })
    set((state) => ({
      messages: state.messages.map((m) => m.id === id ? { ...m, content: trimmed, edited_at: data.edited_at } : m),
    }))
    return data
  },

  deleteMessage: async (id) => {
    await api.delete(`/messages/${id}`)
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) }))
  },

  sendMessage: async (content, attachments = []) => {
    const { activeDiscussion } = get()
    if (!activeDiscussion || !content.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      discussion_id: activeDiscussion.id,
      content,
      role: 'user',
      attachments,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    set(state => ({ messages: [...state.messages, optimistic] }))

    try {
      const data = await api.post('/messages', {
        discussion_id: activeDiscussion.id,
        content,
        role: 'user',
        attachments,
      })
      // Replace optimistic message with server response
      set(state => ({
        messages: state.messages.map(m => m.id === tempId ? { ...data, attachments: data.attachments || [] } : m),
      }))
      return data
    } catch (err) {
      // Remove optimistic message on error
      set(state => ({ messages: state.messages.filter(m => m.id !== tempId) }))
      console.error('Error sending message:', err)
      throw err
    }
  }
}))
