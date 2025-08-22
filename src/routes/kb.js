import { Router } from 'express'
import { validate, schemas } from '../utils/validators.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { searchKB, createKB, updateKB, deleteKB } from '../controllers/kbController.js'

const router = Router()

router.get('/', authRequired, searchKB)
router.post('/', authRequired, requireRole('admin'), validate(schemas.article), createKB)
router.put('/:id', authRequired, requireRole('admin'), validate(schemas.article), updateKB)
router.delete('/:id', authRequired, requireRole('admin'), deleteKB)

export default router


