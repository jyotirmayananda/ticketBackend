import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import { v4 as uuidv4 } from 'uuid'

export async function createTicket(req, res) {
  const t = await Ticket.create({ ...req.body, createdBy: req.user.id })
  await AuditLog.create({ ticketId: t._id, traceId: uuidv4(), actor: 'user', action: 'ticket_created', meta: { title: t.title } })
  
  // Auto-trigger triage
  try {
    const { triageTicket } = await import('../agent/stubLLM.js')
    await triageTicket(t._id)
  } catch (error) {
    console.error('Triage failed for ticket:', t._id, error)
    // Don't fail the ticket creation if triage fails
  }
  
  res.status(201).json({ id: t._id })
}

export async function listTickets(req, res) {
  const { status, mine } = req.query
  const filter = {}
  if (status) filter.status = status
  if (mine === 'true') filter.createdBy = req.user.id
  const list = await Ticket.find(filter).populate('createdBy assignee', 'email').lean()
  res.json(list.map((t) => ({ id: t._id, title: t.title, status: t.status, requester: t.createdBy, assignee: t.assignee })))
}

export async function getTicket(req, res) {
  const t = await Ticket.findById(req.params.id).populate('createdBy assignee').lean()
  if (!t) return res.status(404).json({ error: 'Not found' })
  // Include suggestion and audit if available — populated elsewhere
  const audit = await AuditLog.find({ ticketId: t._id }).sort({ timestamp: -1 }).lean()
  res.json({ ...t, id: t._id, audit })
}

export async function replyTicket(req, res) {
  const ticket = await Ticket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  
  // Add reply to conversation
  if (!ticket.conversation) ticket.conversation = []
  ticket.conversation.push({
    author: req.user.email,
    message: req.body.message,
    timestamp: new Date()
  })
  
  // Update ticket status
  ticket.status = 'resolved'
  ticket.updatedAt = new Date()
  await ticket.save()
  
  await AuditLog.create({ 
    ticketId: req.params.id, 
    traceId: uuidv4(), 
    actor: 'agent', 
    action: 'agent_reply', 
    meta: { message: req.body.message, status: 'resolved' } 
  })
  
  res.status(200).json({ ok: true })
}

export async function assignTicket(req, res) {
  const user = await User.findOne({ email: req.body.assignee })
  if (!user) return res.status(404).json({ error: 'Assignee not found' })
  const t = await Ticket.findByIdAndUpdate(req.params.id, { assignee: user._id }, { new: true })
  if (!t) return res.status(404).json({ error: 'Not found' })
  await AuditLog.create({ ticketId: t._id, traceId: uuidv4(), actor: 'agent', action: 'assigned', meta: { assignee: user.email } })
  res.json({ ok: true })
}


