import { Router } from 'express'
import db from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM discussions d WHERE d.project_id = p.id) as discussion_count
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects
router.post('/', async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  try {
    const [result] = await db.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || '', req.user.id]
    )
    // Add owner as admin member
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    )
    res.status(201).json({
      id: result.insertId,
      name,
      description: description || '',
      owner_id: req.user.id,
      archived: 0,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/projects/:id — owner only: rename, description, archive flag
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
  const { name, description, archived } = req.body

  try {
    const [owned] = await db.query(
      'SELECT id FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    )
    if (!owned.length) return res.status(404).json({ error: 'Project not found' })

    const updates = []
    const vals = []
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name required' })
      }
      updates.push('name = ?')
      vals.push(name.trim())
    }
    if (description !== undefined) {
      updates.push('description = ?')
      vals.push(typeof description === 'string' ? description : '')
    }
    if (archived !== undefined) {
      updates.push('archived = ?')
      vals.push(archived ? 1 : 0)
    }
    if (updates.length) {
      vals.push(id)
      await db.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, vals)
    }

    const [rows] = await db.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM discussions d WHERE d.project_id = p.id) as discussion_count
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`,
      [id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM projects WHERE id = ? AND owner_id = ?', [
      req.params.id,
      req.user.id,
    ])
    if (!result.affectedRows) return res.status(404).json({ error: 'Project not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
