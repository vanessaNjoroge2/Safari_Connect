import { prisma } from "../../config/prisma.js";

export const createRoute = async (payload) => {
  const { origin, destination, distanceKm, estimatedTime } = payload;

  const existingRoute = await prisma.route.findFirst({
    where: {
      origin: {
        equals: origin,
        mode: "insensitive",
      },
      destination: {
        equals: destination,
        mode: "insensitive",
      },
    },
  });

  if (existingRoute) {
    throw new Error("Route already exists");
  }

  return prisma.route.create({
    data: {
      origin,
      destination,
      distanceKm,
      estimatedTime,
    },
  });
};

export const getRoutes = async () => {
  return prisma.route.findMany({
    orderBy: [
      { origin: "asc" },
      { destination: "asc" },
    ],
  });
};