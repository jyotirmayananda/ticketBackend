import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
  traceId: { type: String, index: true },
  actor: { type: String, enum: ['system', 'agent', 'user'], index: true },
  action: { type: String, required: true },
  meta: { type: Object },
  timestamp: { type: Date, default: Date.now },
})

export default mongoose.model('AuditLog', auditLogSchema)


