import Article from '../models/Article.js'

export async function searchKB(req, res) {
  const { query } = req.query
  if (!query) {
    const list = await Article.find().lean()
    return res.json(list)
  }
  const regex = new RegExp(query, 'i')
  const list = await Article.find({ $or: [{ title: regex }, { body: regex }, { tags: regex }] }).lean()
  res.json(list)
}

export async function createKB(req, res) {
  const article = await Article.create(req.body)
  res.status(201).json(article)
}

export async function updateKB(req, res) {
  const article = await Article.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true })
  if (!article) return res.status(404).json({ error: 'Not found' })
  res.json(article)
}

export async function deleteKB(req, res) {
  const ok = await Article.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
}


