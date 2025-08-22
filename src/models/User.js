import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent', 'user'], default: 'user', index: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('User', userSchema)


