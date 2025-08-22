import { Router } from 'express'
import AuditLog from '../models/AuditLog.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
router.get('/:id/audit', authRequired, async (req, res) => {
  const items = await AuditLog.find({ ticketId: req.params.id }).sort({ timestamp: -1 }).lean()
  res.json(items)
})
export default router


