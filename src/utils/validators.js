import Joi from 'joi'

export const schemas = {
  register: Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() }),
  login: Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(6).required() }),
  article: Joi.object({ title: Joi.string().required(), body: Joi.string().required(), tags: Joi.array().items(Joi.string()).default([]), status: Joi.string().valid('draft', 'published').default('draft') }),
  ticketCreate: Joi.object({ title: Joi.string().required(), description: Joi.string().required(), category: Joi.string().valid('billing', 'tech', 'shipping', 'other').default('other'), attachments: Joi.array().items(Joi.string()).default([]) }),
  ticketReply: Joi.object({ message: Joi.string().required() }),
  assign: Joi.object({ assignee: Joi.string().email().required() }),
  config: Joi.object({ autoCloseEnabled: Joi.boolean().required(), confidenceThreshold: Joi.number().min(0).max(1).required(), slaHours: Joi.number().min(1).required() }),
}

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body)
    if (error) return res.status(400).json({ error: error.message })
    req.body = value
    next()
  }
}


