import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin'
    }
  })
  console.log(`✅ Admin user: ${admin.email}`)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'user'
    }
  })
  console.log(`✅ Test user: ${user.email}`)

  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        agent: 'system',
        action: 'database_initialized',
        details: 'Database seeded with default users',
        level: 'info'
      },
      {
        userId: admin.id,
        agent: 'system',
        action: 'welcome',
        details: 'Welcome to MI AI Coding Platform!',
        level: 'info'
      }
    ],
    skipDuplicates: true
  })
  console.log('✅ Sample activity logs created')

  // Create default VNC configurations
  await prisma.vNCConfig.upsert({
    where: { display: ':98' },
    update: {},
    create: {
      display: ':98',
      port: 6081,
      resolution: '1280x720',
      isActive: true
    }
  })
  console.log('✅ VNC config for display :98 (Terminal)')

  await prisma.vNCConfig.upsert({
    where: { display: ':99' },
    update: {},
    create: {
      display: ':99',
      port: 6080,
      resolution: '1280x720',
      isActive: true
    }
  })
  console.log('✅ VNC config for display :99 (Playwright)')

  console.log('')
  console.log('========================================')
  console.log('✅ Database seeded successfully!')
  console.log('========================================')
  console.log('')
  console.log('Default login credentials:')
  console.log('  Admin: admin@example.com / admin123')
  console.log('  User:  user@example.com / user123')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
