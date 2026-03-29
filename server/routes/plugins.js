import { Router } from 'express'
import { getAvailablePlugins } from '../services/plugin-loader.js'

const router = Router()

// GET /api/plugins — list all available plugins by type
router.get('/', (req, res) => {
  res.json(getAvailablePlugins())
})

export default router
