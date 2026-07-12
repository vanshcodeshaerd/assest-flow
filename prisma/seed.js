const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({})

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.ai' },
    update: {},
    create: {
      email: 'admin@assetflow.ai',
      passwordHash: 'admin123',
      role: 'ADMIN',
    },
  })
  console.log('Seeded admin:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
