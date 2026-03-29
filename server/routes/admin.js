import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/index.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authenticate, requireAdmin)

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, role, name, avatar, active, created_at FROM users ORDER BY created_at DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/users — create user
router.post('/users', async (req, res) => {
  const { email, password, name, role = 'user' } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const hash = await bcrypt.hash(password, 12)
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email.toLowerCase().trim(), hash, name || '', role]
    )
    res.status(201).json({ id: result.insertId, email, name, role })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/users/:id — update user
router.put('/users/:id', async (req, res) => {
  const { name, role, active, password } = req.body
  const { id } = req.params
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 12)
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id])
    }
    await db.query(
      'UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?',
      [name, role, active ? 1 : 0, id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
