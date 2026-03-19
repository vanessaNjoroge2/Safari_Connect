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

export const updateCategory = async (categoryId, payload) => {
  const { name, slug, description } = payload;

  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw new Error("Category not found");
  }

  if (name || slug) {
    const conflict = await prisma.category.findFirst({
      where: {
        id: { not: categoryId },
        OR: [
          ...(name ? [{ name }] : []),
          ...(slug ? [{ slug }] : []),
        ],
      },
    });
    if (conflict) {
      throw new Error("Category already exists");
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });
};

export const deleteCategory = async (categoryId) => {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw new Error("Category not found");
  }

  return prisma.category.delete({ where: { id: categoryId } });
};