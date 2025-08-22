import dotenv from 'dotenv'
dotenv.config()
import http from 'http'
import app from './app.js'
import { connectMongo } from './config/db.js'

const port = process.env.PORT || 3000
app.set('port', port)

async function start() {
  try {
    await connectMongo()
    const server = http.createServer(app)
    server.listen(port, () => {
      console.log(`API listening on :${port}`)
    })
  } catch (error) {
    console.error('Failed to connect to MongoDB', error)
    process.exit(1)
  }
}

start()


