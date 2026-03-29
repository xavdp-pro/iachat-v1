import { Router } from 'express'
import db from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/discussions?project_id=X
router.get('/', async (req, res) => {
  const { project_id } = req.query
  if (!project_id) return res.status(400).json({ error: 'project_id required' })
  try {
    const [rows] = await db.query(
      `SELECT d.*, u.name as creator_name,
        (SELECT COUNT(*) FROM messages m WHERE m.discussion_id = d.id) as message_count,
        (SELECT m.created_at FROM messages m WHERE m.discussion_id = d.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
       FROM discussions d
       JOIN users u ON u.id = d.created_by
       WHERE d.project_id = ?
       ORDER BY last_message_at DESC, d.created_at DESC`,
      [project_id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/discussions
router.post('/', async (req, res) => {
  const { project_id, title } = req.body
  if (!project_id) return res.status(400).json({ error: 'project_id required' })
  try {
    const [result] = await db.query(
      'INSERT INTO discussions (project_id, title, created_by) VALUES (?, ?, ?)',
      [project_id, title || 'New discussion', req.user.id]
    )
    res.status(201).json({ id: result.insertId, project_id, title, created_by: req.user.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/discussions/:id — creator may rename
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
  const { title } = req.body
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title required' })
  }
  try {
    const [result] = await db.query(
      'UPDATE discussions SET title = ? WHERE id = ? AND created_by = ?',
      [title.trim(), id, req.user.id]
    )
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' })
    const [rows] = await db.query(
      `SELECT d.*, u.name as creator_name,
        (SELECT COUNT(*) FROM messages m WHERE m.discussion_id = d.id) as message_count,
        (SELECT m.created_at FROM messages m WHERE m.discussion_id = d.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
       FROM discussions d
       JOIN users u ON u.id = d.created_by
       WHERE d.id = ?`,
      [id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/discussions/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM discussions WHERE id = ? AND created_by = ?', [
      req.params.id,
      req.user.id,
    ])
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
