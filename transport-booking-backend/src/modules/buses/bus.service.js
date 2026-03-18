import { prisma } from "../../config/prisma.js";

export const createBus = async (userId, payload) => {
  const { name, plateNumber, seatCapacity } = payload;

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  const existingBus = await prisma.bus.findUnique({
    where: { plateNumber },
  });

  if (existingBus) {
    throw new Error("Bus with this plate number already exists");
  }

  return prisma.bus.create({
    data: {
      saccoId: ownerProfile.sacco.id,
      name,
      plateNumber,
      seatCapacity,
    },
  });
};

export const getMyBuses = async (userId) => {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  return prisma.bus.findMany({
    where: {
      saccoId: ownerProfile.sacco.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createSeatsForBus = async (userId, busId, seats) => {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  const bus = await prisma.bus.findFirst({
    where: {
      id: busId,
      saccoId: ownerProfile.sacco.id,
    },
    include: {
      seats: true,
    },
  });

  if (!bus) {
    throw new Error("Bus not found");
  }

  if (bus.seats.length > 0) {
    throw new Error("Seats already created for this bus");
  }

  if (seats.length > bus.seatCapacity) {
    throw new Error("Seats exceed bus capacity");
  }

  const createdSeats = await prisma.$transaction(
    seats.map((seat) =>
      prisma.seat.create({
        data: {
          busId,
          seatNumber: seat.seatNumber,
          seatClass: seat.seatClass,
          price: seat.price,
        },
      })
    )
  );

  return createdSeats;
};

export const getBusSeats = async (userId, busId) => {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  const bus = await prisma.bus.findFirst({
    where: {
      id: busId,
      saccoId: ownerProfile.sacco.id,
    },
  });

  if (!bus) {
    throw new Error("Bus not found");
  }

  return prisma.seat.findMany({
    where: { busId },
    orderBy: {
      seatNumber: "asc",
    },
  });
};