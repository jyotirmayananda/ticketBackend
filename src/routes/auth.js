import { Router } from 'express'
import { validate, schemas } from '../utils/validators.js'
import { login, register, me } from '../controllers/authController.js'
import { authRequired } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.post('/register', authLimiter, validate(schemas.register), register)
router.post('/login', authLimiter, validate(schemas.login), login)
router.get('/me', authRequired, me)

export default router


