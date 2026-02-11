import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@church.org" },
    update: {},
    create: {
      name: "Freddy Moyo",
      email: "admin@church.org",
      password,
      role: "SUPER_ADMIN",
    },
  })

  console.log("Seeded admin user:", admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
