import AgentSuggestion from '../models/AgentSuggestion.js'
import { triageTicket } from '../agent/stubLLM.js'

export async function triggerTriage(req, res) {
  const { ticketId } = req.body
  const suggestion = await triageTicket(ticketId)
  res.json({ id: suggestion._id })
}

export async function getSuggestion(req, res) {
  const s = await AgentSuggestion.findOne({ ticketId: req.params.ticketId }).populate('articleIds', 'title').lean()
  if (!s) return res.status(404).json({ error: 'Not found' })
  res.json({
    ticketId: s.ticketId,
    predictedCategory: s.predictedCategory,
    citations: s.articleIds.map(a => ({ id: a._id, title: a.title })),
    draft: s.draftReply,
    confidence: s.confidence,
    status: s.autoClosed ? 'auto_closed' : 'waiting_human',
  })
}


