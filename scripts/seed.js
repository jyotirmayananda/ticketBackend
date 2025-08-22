import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { connectMongo } from '../src/config/db.js'
import User from '../src/models/User.js'
import Article from '../src/models/Article.js'
import Ticket from '../src/models/Ticket.js'
import Config from '../src/models/Config.js'

async function run() {
  console.log('🌱 Starting database seeding...')

  await connectMongo()

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await Promise.all([
    User.deleteMany({}),
    Article.deleteMany({}),
    Ticket.deleteMany({}),
    Config.deleteMany({}),
  ])

  // Create users
  console.log('👥 Creating users...')
  const [admin, agent, user1, user2] = await User.create([
    {
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      role: 'admin',
      passwordHash: await bcrypt.hash('password123', 10),
    },
    {
      name: 'Support Agent',
      email: 'agent@helpdesk.com',
      role: 'agent',
      passwordHash: await bcrypt.hash('password123', 10),
    },
    {
      name: 'John Customer',
      email: 'john@example.com',
      role: 'user',
      passwordHash: await bcrypt.hash('password123', 10),
    },
    {
      name: 'Jane Customer',
      email: 'jane@example.com',
      role: 'user',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  ])

  // Create KB articles
  console.log('📚 Creating knowledge base articles...')
  await Article.create([
    {
      title: 'How to request a refund',
      body:
        'To request a refund, please follow these steps:\n\n1. Log into your account\n2. Go to Orders section\n3. Find the order you want to refund\n4. Click "Request Refund"\n5. Select the reason for refund\n6. Submit your request\n\nRefunds are typically processed within 3-5 business days.',
      tags: ['refund', 'billing', 'orders'],
      status: 'published',
    },
    {
      title: 'Troubleshooting login issues',
      body:
        'If you\'re having trouble logging in:\n\n1. Check your email and password\n2. Clear your browser cache\n3. Try incognito/private mode\n4. Reset your password if needed\n5. Contact support if issues persist\n\nCommon issues include expired sessions and incorrect credentials.',
      tags: ['login', 'tech', 'authentication'],
      status: 'published',
    },
    {
      title: 'Tracking your shipment',
      body:
        'To track your shipment:\n\n1. Check your order confirmation email\n2. Use the tracking number provided\n3. Visit our tracking page\n4. Enter your tracking number\n5. View real-time updates\n\nDelivery typically takes 3-7 business days.',
      tags: ['shipping', 'delivery', 'tracking'],
      status: 'published',
    },
    {
      title: 'Updating payment methods',
      body:
        'To update your payment method:\n\n1. Go to Account Settings\n2. Select Payment Methods\n3. Click "Add New Payment Method"\n4. Enter your card details\n5. Save the information\n\nWe accept Visa, MasterCard, and American Express.',
      tags: ['billing', 'payments', 'account'],
      status: 'published',
    },
    {
      title: 'Resolving 500 server errors',
      body:
        'If you encounter a 500 server error:\n\n1. Refresh the page\n2. Clear browser cache and cookies\n3. Try a different browser\n4. Check if the issue persists\n5. Contact support with error details\n\nThese errors are usually temporary and resolve quickly.',
      tags: ['tech', 'errors', 'server'],
      status: 'published',
    },
  ])

  // Create sample tickets
  console.log('🎫 Creating sample tickets...')
  await Ticket.create([
    {
      title: 'Refund request for double charge',
      description:
        'I was charged twice for order #12345. I need a refund for the duplicate charge.',
      category: 'billing',
      status: 'open',
      createdBy: user1._id,
    },
    {
      title: 'App shows 500 error on login',
      description:
        'I keep getting a 500 server error when trying to log into the mobile app. This started happening yesterday.',
      category: 'tech',
      status: 'open',
      createdBy: user2._id,
    },
    {
      title: 'Where is my package?',
      description:
        "My shipment was supposed to arrive 3 days ago but the tracking shows it's still in transit. Can you help me locate it?",
      category: 'shipping',
      status: 'open',
      createdBy: user1._id,
    },
  ])

  // Create default config
  console.log('⚙️ Creating default configuration...')
  await Config.create({
    autoCloseEnabled: true,
    confidenceThreshold: 0.78,
    slaHours: 24,
  })

  console.log('✅ Seeding completed successfully!')
  console.log('\n📋 Sample Data Created:')
  console.log(`- Users: ${await User.countDocuments()}`)
  console.log(`- Articles: ${await Article.countDocuments()}`)
  console.log(`- Tickets: ${await Ticket.countDocuments()}`)
  console.log(`- Config: ${await Config.countDocuments()}`)

  console.log('\n🔑 Login Credentials:')
  console.log('Admin: admin@helpdesk.com / password123')
  console.log('Agent: agent@helpdesk.com / password123')
  console.log('User: john@example.com / password123')

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('❌ Seeding failed:', e)
  process.exit(1)
})


