import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import { validate, schemas } from '../utils/validators.js'
import { createTicket, listTickets, getTicket, replyTicket, assignTicket } from '../controllers/ticketController.js'
import { ticketLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.post('/', authRequired, ticketLimiter, validate(schemas.ticketCreate), createTicket)
router.get('/', authRequired, listTickets)
router.get('/:id', authRequired, getTicket)
router.post('/:id/reply', authRequired, requireRole('agent', 'admin'), validate(schemas.ticketReply), replyTicket)
router.post('/:id/assign', authRequired, requireRole('agent', 'admin'), validate(schemas.assign), assignTicket)

export default router


