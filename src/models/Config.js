import mongoose from 'mongoose'

const configSchema = new mongoose.Schema({
  autoCloseEnabled: { type: Boolean, default: false },
  confidenceThreshold: { type: Number, default: 0.7 },
  slaHours: { type: Number, default: 24 },
})

export default mongoose.model('Config', configSchema)


