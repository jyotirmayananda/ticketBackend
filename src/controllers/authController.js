import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function sign(user) {
  const payload = { id: user._id, email: user.email, role: user.role, name: user.name }
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
  return token
}

export async function register(req, res) {
  const { name, email, password } = req.body
  const exists = await User.findOne({ email })
  if (exists) return res.status(400).json({ error: 'Email already in use' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, passwordHash, role: 'user' })
  const token = sign(user)
  res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } })
}

export async function login(req, res) {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = sign(user)
  res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } })
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).lean()
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({ id: user._id, email: user.email, role: user.role, name: user.name })
}


