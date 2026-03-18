import { prisma } from "../../config/prisma.js";

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const createCategory = async (payload) => {
  const { name, slug, description } = payload;

  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  return prisma.category.create({
    data: {
      name,
      slug,
      description,
    },
  });
};