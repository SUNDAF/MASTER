const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Owner";

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL dan ADMIN_PASSWORD");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { password: hash, name },
    create: { email, password: hash, name },
  });

  console.log(`✓ Admin dibuat: ${email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
