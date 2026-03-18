import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: "Buses",
      slug: "buses",
      description: "Long distance and public service buses",
    },
    {
      name: "Motorbikes",
      slug: "motorbikes",
      description: "Boda boda and bike transport services",
    },
    {
      name: "Matatu",
      slug: "matatu",
      description: "Matatu and shuttle transport services",
    },
    {
      name: "Carrier Services",
      slug: "carrier-services",
      description: "Parcel and goods carrier services",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const adminEmail = "admin@transport.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    await prisma.user.create({
      data: {
        firstName: "System",
        lastName: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
      },
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });