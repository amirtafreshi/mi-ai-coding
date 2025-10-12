import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Hash the admin password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log('Admin user created:', adminUser.email)

  // Create test users for E2E testing
  const testUserPassword = await bcrypt.hash('password123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: testUserPassword,
      role: 'user',
    },
  })

  const devPassword = await bcrypt.hash('dev123', 10)
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      name: 'Developer User',
      password: devPassword,
      role: 'developer',
    },
  })

  console.log('Test users created:', testUser.email, devUser.email)

  // Create VNC configurations
  const vncConfigs = await Promise.all([
    prisma.vNCConfig.upsert({
      where: { display: ':98' },
      update: {},
      create: {
        display: ':98',
        port: 6081,
        resolution: '1024x768',
        isActive: true,
      },
    }),
    prisma.vNCConfig.upsert({
      where: { display: ':99' },
      update: {},
      create: {
        display: ':99',
        port: 6080,
        resolution: '1024x768',
        isActive: true,
      },
    }),
  ])

  console.log('VNC configurations created:', vncConfigs.length)

  // Create initial activity log
  const activityLog = await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      agent: 'database-seed',
      action: 'database_initialized',
      details: 'Database seeded with admin user and VNC configurations',
      level: 'info',
    },
  })

  console.log('Initial activity log created:', activityLog.id)

  // Create example folder structure
  const rootFolder = await prisma.folder.upsert({
    where: { path: '/' },
    update: {},
    create: {
      path: '/',
      name: 'root',
      parentId: null,
    },
  })

  const projectsFolder = await prisma.folder.upsert({
    where: { path: '/projects' },
    update: {},
    create: {
      path: '/projects',
      name: 'projects',
      parentId: rootFolder.id,
    },
  })

  console.log('Example folder structure created')

  // Create example file
  const exampleFile = await prisma.file.upsert({
    where: { path: '/projects/README.md' },
    update: {},
    create: {
      path: '/projects/README.md',
      name: 'README.md',
      content: '# Welcome to MI AI Coding Platform\n\nThis is an example file in your projects folder.\n',
      size: 95,
      mimeType: 'text/markdown',
    },
  })

  console.log('Example file created:', exampleFile.name)

  console.log('Database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
