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

export const updateRoute = async (routeId, payload) => {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) {
    throw new Error("Route not found");
  }

  const nextOrigin = payload.origin?.trim() || route.origin;
  const nextDestination = payload.destination?.trim() || route.destination;

  if (!nextOrigin || !nextDestination) {
    throw new Error("Origin and destination are required");
  }

  const duplicate = await prisma.route.findFirst({
    where: {
      id: { not: routeId },
      origin: { equals: nextOrigin, mode: "insensitive" },
      destination: { equals: nextDestination, mode: "insensitive" },
    },
  });

  if (duplicate) {
    throw new Error("Route already exists");
  }

  return prisma.route.update({
    where: { id: routeId },
    data: {
      origin: nextOrigin,
      destination: nextDestination,
      ...(payload.distanceKm !== undefined ? { distanceKm: Number(payload.distanceKm) } : {}),
      ...(payload.estimatedTime !== undefined ? { estimatedTime: Number(payload.estimatedTime) } : {}),
    },
  });
};

export const deleteRoute = async (routeId) => {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) {
    throw new Error("Route not found");
  }

  const linkedTrips = await prisma.trip.count({ where: { routeId } });
  if (linkedTrips > 0) {
    throw new Error("Cannot delete route with existing trips");
  }

  await prisma.route.delete({ where: { id: routeId } });
  return { id: routeId };
};