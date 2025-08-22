import { v4 as uuidv4 } from 'uuid'
import Article from '../models/Article.js'
import Ticket from '../models/Ticket.js'
import AgentSuggestion from '../models/AgentSuggestion.js'
import AuditLog from '../models/AuditLog.js'
import Config from '../models/Config.js'

export async function classify(text) {
  const lc = text.toLowerCase()
  if (/(refund|invoice)/.test(lc)) return { category: 'billing', confidence: 0.9 }
  if (/(error|bug|stack)/.test(lc)) return { category: 'tech', confidence: 0.85 }
  if (/(shipment|delivery)/.test(lc)) return { category: 'shipping', confidence: 0.8 }
  return { category: 'other', confidence: 0.6 }
}

export async function retrieveKB(ticket) {
  const terms = ticket.description.toLowerCase().split(/\W+/).filter(Boolean)
  const regex = new RegExp(terms.slice(0, 5).join('|'), 'i')
  const articles = await Article.find({ $or: [{ title: regex }, { body: regex }, { tags: regex }], status: 'published' }).limit(3).lean()
  return articles
}

export function draftReply(ticket, articles) {
  const refs = articles.map((a, i) => `[${i + 1}] ${a.title}`).join('\n')
  return `Hello, regarding "${ticket.title}", here are some steps to help you.\n${refs}`
}

export async function decision({ ticket, classification, articles, draft, traceId }) {
  const cfg = await Config.findOne() || { autoCloseEnabled: false, confidenceThreshold: 0.7 }
  const auto = cfg.autoCloseEnabled && classification.confidence >= cfg.confidenceThreshold
  const suggestion = await AgentSuggestion.create({
    ticketId: ticket._id,
    predictedCategory: classification.category,
    articleIds: articles.map(a => a._id),
    draftReply: draft,
    confidence: classification.confidence,
    autoClosed: auto,
    modelInfo: { provider: 'stub', model: 'heuristic:v1', promptVersion: 'v1', latencyMs: 5 }
  })
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'suggestion_created', meta: { suggestionId: suggestion._id } })
  if (auto) {
    ticket.status = 'resolved'
    ticket.agentSuggestionId = suggestion._id
    await ticket.save()
    await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'auto_closed', meta: { confidence: classification.confidence } })
  } else {
    ticket.status = 'waiting_human'
    ticket.agentSuggestionId = suggestion._id
    await ticket.save()
    await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'waiting_human', meta: {} })
  }
  return suggestion
}

export async function triageTicket(ticketId) {
  const traceId = uuidv4()
  const ticket = await Ticket.findById(ticketId)
  if (!ticket) throw new Error('Ticket not found')
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'triage_start', meta: {} })
  const classification = await classify(ticket.description)
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'classified', meta: classification })
  const articles = await retrieveKB(ticket)
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'retrieved_kb', meta: { articleIds: articles.map(a => a._id) } })
  const draft = draftReply(ticket, articles)
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'drafted_reply', meta: {} })
  const suggestion = await decision({ ticket, classification, articles, draft, traceId })
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'system', action: 'triage_end', meta: {} })
  return suggestion
}


