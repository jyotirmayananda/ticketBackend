import Config from '../models/Config.js'

async function getSingleton() {
  let cfg = await Config.findOne()
  if (!cfg) cfg = await Config.create({})
  return cfg
}

export async function getConfig(req, res) {
  const cfg = await getSingleton()
  res.json(cfg)
}

export async function updateConfig(req, res) {
  const cfg = await getSingleton()
  cfg.autoCloseEnabled = req.body.autoCloseEnabled
  cfg.confidenceThreshold = req.body.confidenceThreshold
  cfg.slaHours = req.body.slaHours
  await cfg.save()
  res.json(cfg)
}


