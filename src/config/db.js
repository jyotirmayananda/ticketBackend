import mongoose from 'mongoose'

let connected = false

export async function connectMongo() {
  if (connected) return mongoose.connection
  const uri = process.env.MONGO_URL || 'mongodb://localhost:27017/helpdesk'
  await mongoose.connect(uri, { autoIndex: true })
  connected = true
  return mongoose.connection
}


