import { v4 as uuidv4 } from 'uuid'

export function requestLogger(req, res, next) {
  const start = Date.now()
  const traceId = req.headers['x-trace-id'] || uuidv4()
  req.traceId = traceId
  res.setHeader('x-trace-id', traceId)
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms trace=${traceId}`)
  })
  next()
}


