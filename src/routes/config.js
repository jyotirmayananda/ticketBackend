import { Router } from 'express'
import { authRequired, requireRole } from '../middleware/auth.js'
import { validate, schemas } from '../utils/validators.js'
import { getConfig, updateConfig } from '../controllers/configController.js'

const router = Router()

router.get('/', authRequired, getConfig)
router.put('/', authRequired, requireRole('admin'), validate(schemas.config), updateConfig)

export default router


