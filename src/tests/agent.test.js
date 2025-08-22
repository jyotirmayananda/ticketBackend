import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectMongo } from '../config/db.js'
import User from '../models/User.js'
import Article from '../models/Article.js'
import Ticket from '../models/Ticket.js'
import AgentSuggestion from '../models/AgentSuggestion.js'
import AuditLog from '../models/AuditLog.js'
import Config from '../models/Config.js'
import { triageTicket } from '../agent/stubLLM.js'

beforeAll(async () => {
  process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/helpdesk_test'
  await connectMongo()
  await Promise.all([
    User.deleteMany({}),
    Article.deleteMany({}),
    Ticket.deleteMany({}),
    AgentSuggestion.deleteMany({}),
    AuditLog.deleteMany({}),
    Config.deleteMany({})
  ])
})

afterAll(async () => {
  await mongoose.connection.close()
})

async function createUser(role, email = `${role}@ex.com`) {
  await request(app).post('/api/auth/register').send({ name: role, email, password: 'password' })
  const user = await User.findOneAndUpdate({ email }, { role }, { new: true })
  const login = await request(app).post('/api/auth/login').send({ email, password: 'password' })
  return login.body.token
}

describe('Agentic Triage Workflow', () => {
  let adminToken, userToken, ticketId

  beforeEach(async () => {
    // Create test data
    adminToken = await createUser('admin', 'admin@test.com')
    userToken = await createUser('user', 'user@test.com')
    
    // Create KB articles
    await Article.create([
      {
        title: 'How to request a refund',
        body: 'Refund process steps...',
        tags: ['refund', 'billing'],
        status: 'published'
      },
      {
        title: 'Fix login errors',
        body: 'Troubleshooting steps...',
        tags: ['login', 'tech'],
        status: 'published'
      }
    ])

    // Create default config
    await Config.create({
      autoCloseEnabled: true,
      confidenceThreshold: 0.8,
      slaHours: 24
    })
  })

  it('should automatically trigger triage when ticket is created', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Refund request',
        description: 'I need a refund for my order'
      })

    expect(res.status).toBe(201)
    ticketId = res.body.id

    // Wait a bit for triage to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that triage was triggered
    const ticket = await Ticket.findById(ticketId)
    expect(ticket.status).toMatch(/resolved|waiting_human/)

    // Check that suggestion was created
    const suggestion = await AgentSuggestion.findOne({ ticketId })
    expect(suggestion).toBeTruthy()
    expect(suggestion.predictedCategory).toBe('billing')
    expect(suggestion.confidence).toBeGreaterThan(0.5)

    // Check audit logs
    const auditLogs = await AuditLog.find({ ticketId })
    expect(auditLogs.length).toBeGreaterThan(1)
    expect(auditLogs.some(log => log.action === 'triage_start')).toBe(true)
  })

  it('should auto-close tickets with high confidence', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Refund for double charge',
        description: 'I was charged twice for invoice #12345, need refund'
      })

    expect(res.status).toBe(201)
    const ticketId = res.body.id

    // Wait for triage
    await new Promise(resolve => setTimeout(resolve, 100))

    const ticket = await Ticket.findById(ticketId)
    const suggestion = await AgentSuggestion.findOne({ ticketId })

    // Should auto-close due to high confidence billing classification
    expect(suggestion.autoClosed).toBe(true)
    expect(ticket.status).toBe('resolved')
  })

  it('should assign to human for low confidence tickets', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'General question',
        description: 'I have a question about your services'
      })

    expect(res.status).toBe(201)
    const ticketId = res.body.id

    // Wait for triage
    await new Promise(resolve => setTimeout(resolve, 100))

    const ticket = await Ticket.findById(ticketId)
    const suggestion = await AgentSuggestion.findOne({ ticketId })

    // Should assign to human due to low confidence
    expect(suggestion.autoClosed).toBe(false)
    expect(ticket.status).toBe('waiting_human')
  })

  it('should retrieve relevant KB articles during triage', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Login error',
        description: 'Getting error when trying to login'
      })

    expect(res.status).toBe(201)
    const ticketId = res.body.id

    // Wait for triage
    await new Promise(resolve => setTimeout(resolve, 100))

    const suggestion = await AgentSuggestion.findOne({ ticketId })
    expect(suggestion.articleIds.length).toBeGreaterThan(0)

    // Check that relevant articles were found
    const articles = await Article.find({ _id: { $in: suggestion.articleIds } })
    expect(articles.some(article => article.tags.includes('tech'))).toBe(true)
  })

  it('should create comprehensive audit trail', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test ticket',
        description: 'Testing audit trail'
      })

    expect(res.status).toBe(201)
    const ticketId = res.body.id

    // Wait for triage
    await new Promise(resolve => setTimeout(resolve, 100))

    const auditLogs = await AuditLog.find({ ticketId }).sort({ timestamp: 1 })
    
    // Should have multiple audit entries
    expect(auditLogs.length).toBeGreaterThan(3)
    
    // Check for key audit events
    const actions = auditLogs.map(log => log.action)
    expect(actions).toContain('ticket_created')
    expect(actions).toContain('triage_start')
    expect(actions).toContain('classified')
    expect(actions).toContain('retrieved_kb')
    expect(actions).toContain('drafted_reply')
    expect(actions).toContain('triage_end')

    // All logs should have same traceId
    const traceIds = [...new Set(auditLogs.map(log => log.traceId))]
    expect(traceIds.length).toBe(1)
  })
})
