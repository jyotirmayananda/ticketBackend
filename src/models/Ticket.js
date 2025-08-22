import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['billing', 'tech', 'shipping', 'other'], default: 'other', index: true },
  status: { type: String, enum: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'], default: 'open', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentSuggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentSuggestion' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.model('Ticket', ticketSchema)


