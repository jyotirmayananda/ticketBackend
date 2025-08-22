import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  body: { type: String, required: true, index: 'text' },
  tags: { type: [String], default: [], index: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.model('Article', articleSchema)


