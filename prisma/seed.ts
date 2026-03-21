import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  // Create manager
  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: 'Manager',
      email: 'manager@example.com',
      passwordHash: hashedPassword,
      role: 'MANAGER',
    },
  })

  // Create drivers
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `driver${i}@example.com` },
      update: {},
      create: {
        name: `Driver ${i}`,
        email: `driver${i}@example.com`,
        passwordHash: hashedPassword,
        role: 'DRIVER',
      },
    })
  }

  console.log('Seeding completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })