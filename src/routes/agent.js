import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import { triggerTriage, getSuggestion } from '../controllers/agentController.js'

const router = Router()

router.post('/triage', authRequired, requireRole('admin', 'agent'), triggerTriage)
router.get('/suggestion/:ticketId', authRequired, getSuggestion)

export default router


