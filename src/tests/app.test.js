import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import { connectMongo } from '../config/db.js'
import User from '../models/User.js'
import Article from '../models/Article.js'
import Ticket from '../models/Ticket.js'

beforeAll(async () => {
  process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/helpdesk_test'
  await connectMongo()
  await Promise.all([User.deleteMany({}), Article.deleteMany({}), Ticket.deleteMany({})])
})

afterAll(async () => {
  await mongoose.connection.close()
})

async function createUser(role, email = `${role}@ex.com`) {
  await request(app).post('/api/auth/register').send({ name: role, email, password: 'password' })
  // Elevate role in DB then login to get a token with correct role claim
  const user = await User.findOneAndUpdate({ email }, { role }, { new: true })
  expect(user).toBeTruthy()
  const login = await request(app).post('/api/auth/login').send({ email, password: 'password' })
  return login.body.token
}

describe('Auth', () => {
  it('registers and logs in', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'u', email: 'u@ex.com', password: 'password' })
    expect(r.status).toBe(200)
    const l = await request(app).post('/api/auth/login').send({ email: 'u@ex.com', password: 'password' })
    expect(l.body.token).toBeDefined()
  })
})

describe('KB', () => {
  it('searches by query', async () => {
    const admin = await createUser('admin', 'a@ex.com')
    await request(app).post('/api/kb').set('Authorization', `Bearer ${admin}`).send({ title: 'Refund', body: 'refund steps', tags: ['billing'], status: 'published' })
    const res = await request(app).get('/api/kb?query=refund').set('Authorization', `Bearer ${admin}`)
    expect(res.body.length).toBeGreaterThan(0)
  })
})

describe('Tickets', () => {
  it('creates a ticket', async () => {
    const token = await createUser('user', 'tuser@ex.com')
    const res = await request(app).post('/api/tickets').set('Authorization', `Bearer ${token}`).send({ title: 'Help', description: 'Need assistance' })
    expect(res.status).toBe(201)
  })
})

describe('Agent triage', () => {
  it('auto closes when confident', async () => {
    const admin = await createUser('admin', 'admin2@ex.com')
    await request(app).post('/api/kb').set('Authorization', `Bearer ${admin}`).send({ title: 'Invoice refund', body: 'refund', tags: ['refund'], status: 'published' })
    const t = await request(app).post('/api/tickets').set('Authorization', `Bearer ${admin}`).send({ title: 'Refund', description: 'refund invoice please' })
    const triage = await request(app).post('/api/agent/triage').set('Authorization', `Bearer ${admin}`).send({ ticketId: t.body.id })
    expect(triage.status).toBe(200)
    const detail = await request(app).get(`/api/tickets/${t.body.id}`).set('Authorization', `Bearer ${admin}`)
    expect(['resolved', 'waiting_human']).toContain(detail.body.status)
  })
})

describe('Audit log', () => {
  it('creates audit entries', async () => {
    const admin = await createUser('admin', 'admin3@ex.com')
    const t = await request(app).post('/api/tickets').set('Authorization', `Bearer ${admin}`).send({ title: 'Bug', description: 'error stack' })
    await request(app).post('/api/agent/triage').set('Authorization', `Bearer ${admin}`).send({ ticketId: t.body.id })
    const audit = await request(app).get(`/api/tickets/${t.body.id}`).set('Authorization', `Bearer ${admin}`)
    expect(Array.isArray(audit.body.audit)).toBe(true)
    expect(audit.body.audit.length).toBeGreaterThan(0)
  })
})


