import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, ShieldCheck, User, Loader2, Moon, Sun, MessageSquare, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore.js'
import { useThemeStore } from '../store/useThemeStore.js'
import api from '../api/index.js'

export default function Admin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = useThemeStore()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalUser, setModalUser] = useState(undefined)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.get('/admin/users')
      setUsers(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async () => {
    if (!confirmDelete) return
    await api.delete(`/admin/users/${confirmDelete.id}`)
    setConfirmDelete(null)
    fetchUsers()
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <div className="admin-topbar-mark">
            <ShieldCheck size={18} strokeWidth={2} />
          </div>
          <div className="admin-topbar-text">
            <h1>{t('admin.title')}</h1>
            <p>IAChat</p>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="admin-btn-ghost" onClick={() => navigate('/chat')}>
            <MessageSquare size={16} />
            {t('admin.backToChat')}
          </button>
          <button type="button" className="admin-btn-icon" onClick={toggleDarkMode} aria-label="Theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="admin-btn-icon admin-btn-icon--danger" onClick={logout} aria-label="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-toolbar">
          <div>
            <h2>{t('admin.userListTitle')}</h2>
            <p>{t('admin.subtitle')}</p>
            <p className="admin-toolbar-meta">{t('admin.userCount', { count: users.length })}</p>
          </div>
          <button type="button" className="admin-btn-primary" onClick={() => setModalUser(null)}>
            <Plus size={17} strokeWidth={2} />
            {t('admin.addUser')}
          </button>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span>{t('common.loading')}</span>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.colName')}</th>
                  <th>{t('admin.colEmail')}</th>
                  <th>{t('admin.colRole')}</th>
                  <th>{t('admin.colStatus')}</th>
                  <th>{t('admin.colCreated')}</th>
                  <th aria-label={t('admin.colActions')} />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <td>
                      <div className="admin-user-cell">
                        <div className={`admin-avatar ${u.role === 'admin' ? '' : 'admin-avatar--user'}`}>
                          {u.role === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                        </div>
                        <span className="admin-user-name">{u.name || t('admin.anonymous')}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-2)' }}>{u.email}</td>
                    <td>
                      <span className={`admin-badge ${u.role === 'admin' ? '' : 'admin-badge--muted'}`}>
                        {u.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser')}
                      </span>
                    </td>
                    <td>
                      <span className="admin-status">
                        <span className={`admin-status-dot ${u.active ? 'admin-status-dot--on' : 'admin-status-dot--off'}`} />
                        {u.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-3)', fontSize: '0.8125rem' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-table-icon-btn"
                          onClick={() => setModalUser(u)}
                          aria-label={t('common.edit')}
                        >
                          <Pencil size={15} />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            type="button"
                            className="admin-table-icon-btn admin-table-icon-btn--danger"
                            onClick={() => setConfirmDelete(u)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      <AnimatePresence>
        {modalUser !== undefined && (
          <UserModal
            user={modalUser}
            onSave={() => {
              setModalUser(undefined)
              fetchUsers()
            }}
            onClose={() => setModalUser(undefined)}
          />
        )}
        {confirmDelete && (
          <ConfirmModal
            title={t('admin.deleteTitle')}
            message={t('admin.deleteMessage', { email: confirmDelete.email })}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
            confirmLabel={t('common.delete')}
            cancelLabel={t('common.cancel')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function UserModal({ user, onSave, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    email: user?.email || '',
    name: user?.name || '',
    role: user?.role || 'user',
    password: '',
    active: user?.active !== undefined ? user.active : true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (user) await api.put(`/admin/users/${user.id}`, form)
      else await api.post('/admin/users', form)
      onSave()
    } catch (err) {
      setError(err?.error || t('admin.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="chat-modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="chat-modal admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="chat-modal-title">{user ? t('admin.modalEdit') : t('admin.modalNew')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="chat-modal-field">
            <label className="chat-modal-label" htmlFor="adm-email">{t('admin.email')}</label>
            <input
              id="adm-email"
              className="chat-modal-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={!!user}
              required
              autoComplete="email"
            />
          </div>
          <div className="chat-modal-field">
            <label className="chat-modal-label" htmlFor="adm-name">{t('admin.name')}</label>
            <input
              id="adm-name"
              className="chat-modal-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </div>
          <div className="chat-modal-field">
            <label className="chat-modal-label" htmlFor="adm-pw">{t('admin.password')}</label>
            <input
              id="adm-pw"
              className="chat-modal-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div className="admin-form-grid">
            <div className="chat-modal-field" style={{ marginBottom: 0 }}>
              <label className="chat-modal-label" htmlFor="adm-role">{t('admin.role')}</label>
              <select
                id="adm-role"
                className="chat-modal-select"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="user">{t('admin.roleUser')}</option>
                <option value="admin">{t('admin.roleAdmin')}</option>
              </select>
            </div>
            <div className="chat-modal-field" style={{ marginBottom: 0 }}>
              <label className="chat-modal-label" htmlFor="adm-active">{t('admin.accountState')}</label>
              <select
                id="adm-active"
                className="chat-modal-select"
                value={form.active ? '1' : '0'}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === '1' }))}
              >
                <option value="1">{t('common.active')}</option>
                <option value="0">{t('common.inactive')}</option>
              </select>
            </div>
          </div>
          {error && (
            <div
              className="chat-modal-field"
              style={{
                marginBottom: 0,
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                color: 'var(--color-danger)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <div className="chat-modal-actions">
            <button type="button" className="chat-modal-btn chat-modal-btn--secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="chat-modal-btn chat-modal-btn--primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : t('common.save')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel, cancelLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="chat-modal-backdrop"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="admin-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-confirm-actions">
          <button type="button" className="chat-modal-btn chat-modal-btn--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="chat-modal-btn chat-modal-btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
