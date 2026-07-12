import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@assetflow.com" },
    update: {},
    create: {
      email: "admin@assetflow.com",
      firstName: "Admin",
      lastName: "User",
      employeeId: "ADM-001",
      passwordHash: hashPassword("Admin@123"),
      role: "ADMIN",
      status: "ACTIVE",
      isActive: true,
      joinedAt: new Date(),
    },
  });

  console.log("Admin user created:", admin.email);

  const pendingUser = await prisma.user.upsert({
    where: { email: "employee@assetflow.com" },
    update: {},
    create: {
      email: "employee@assetflow.com",
      firstName: "Rahul",
      lastName: "Shah",
      employeeId: "EMP-001",
      passwordHash: hashPassword("Employee@123"),
      role: "EMPLOYEE",
      status: "PENDING",
      isActive: false,
    },
  });

  console.log("Pending employee created:", pendingUser.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
