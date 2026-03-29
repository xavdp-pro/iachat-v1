import { Router } from 'express'
import db from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/messages?discussion_id=X
router.get('/', async (req, res) => {
  const { discussion_id } = req.query
  if (!discussion_id) return res.status(400).json({ error: 'discussion_id required' })
  try {
    const [messages] = await db.query(
      `SELECT m.*, u.name as user_name, u.avatar as user_avatar
       FROM messages m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.discussion_id = ?
       ORDER BY m.created_at ASC`,
      [discussion_id]
    )
    // Load attachments for each message
    const ids = messages.map(m => m.id)
    let attachments = []
    if (ids.length > 0) {
      ;[attachments] = await db.query(
        `SELECT * FROM message_attachments WHERE message_id IN (${ids.map(() => '?').join(',')})`,
        ids
      )
    }
    const attMap = attachments.reduce((acc, a) => {
      if (!acc[a.message_id]) acc[a.message_id] = []
      acc[a.message_id].push(a)
      return acc
    }, {})
    const result = messages.map(m => ({ ...m, attachments: attMap[m.id] || [] }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/messages
router.post('/', async (req, res) => {
  const { discussion_id, content, role = 'user', agent_slug, attachments = [] } = req.body
  if (!discussion_id || !content) return res.status(400).json({ error: 'discussion_id and content required' })
  try {
    const [result] = await db.query(
      'INSERT INTO messages (discussion_id, user_id, role, content, agent_slug) VALUES (?, ?, ?, ?, ?)',
      [discussion_id, role === 'user' ? req.user.id : null, role, content, agent_slug || null]
    )
    const messageId = result.insertId

    // Persist attachments if any
    const savedAttachments = []
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        const [attResult] = await db.query(
          'INSERT INTO message_attachments (message_id, attach_type, name, mime_type, data, size) VALUES (?, ?, ?, ?, ?, ?)',
          [messageId, att.attach_type || 'document', att.name, att.mime_type || null, att.data || null, att.size || null]
        )
        savedAttachments.push({ id: attResult.insertId, message_id: messageId, ...att })
      }
    }

    res.status(201).json({
      id: messageId,
      discussion_id,
      content,
      role,
      agent_slug,
      attachments: savedAttachments,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/messages/:id  — owner only
router.put('/:id', async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'content required' })
  try {
    const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const msg = rows[0]
    if (Number(msg.user_id) !== Number(req.user.id))
      return res.status(403).json({ error: 'Forbidden' })
    await db.query(
      'UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?',
      [content.trim(), req.params.id]
    )
    res.json({ ...msg, content: content.trim(), edited_at: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/messages/:id  — owner only
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    if (Number(rows[0].user_id) !== Number(req.user.id))
      return res.status(403).json({ error: 'Forbidden' })
    await db.query('DELETE FROM messages WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
