import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { connectMongo } from './config/db.js'
import { errorHandler } from './middleware/error.js'
import { requestLogger } from './middleware/requestLogger.js'
import authRoutes from './routes/auth.js'
import kbRoutes from './routes/kb.js'
import ticketRoutes from './routes/tickets.js'
import auditRoutes from './routes/audit.js'
import agentRoutes from './routes/agent.js'
import configRoutes from './routes/config.js'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))
app.use(requestLogger)

app.get('/healthz', (req, res) => res.json({ ok: true }))
app.get('/readyz', async (req, res) => {
  try {
    await connectMongo()
    res.json({ ready: true })
  } catch {
    res.status(503).json({ ready: false })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/kb', kbRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/tickets', auditRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/config', configRoutes)

app.use(errorHandler)

export default app


