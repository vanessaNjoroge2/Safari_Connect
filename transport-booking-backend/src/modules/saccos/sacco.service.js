import { prisma } from "../../config/prisma.js";
import slugify from "slugify";

export const createSacco = async (userId, payload) => {
  const { categoryId, name, logoUrl, supportPhone, supportEmail } = payload;

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile) {
    throw new Error("Owner profile not found");
  }

  if (ownerProfile.sacco) {
    throw new Error("Sacco already exists for this owner");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.sacco.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return prisma.sacco.create({
    data: {
      ownerProfileId: ownerProfile.id,
      categoryId,
      name,
      slug,
      logoUrl,
      supportPhone,
      supportEmail,
    },
  });
};

export const getMySacco = async (userId) => {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: {
      sacco: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!ownerProfile) {
    throw new Error("Owner profile not found");
  }

  return ownerProfile.sacco;
};