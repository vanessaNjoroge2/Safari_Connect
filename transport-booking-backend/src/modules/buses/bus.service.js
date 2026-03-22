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

export const updateBus = async (userId, busId, payload) => {
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

  const nextName = payload.name?.trim();
  const nextPlate = payload.plateNumber?.trim().toUpperCase();
  const nextCapacity = Number(payload.seatCapacity);

  if (nextPlate && nextPlate !== bus.plateNumber) {
    const existing = await prisma.bus.findUnique({ where: { plateNumber: nextPlate } });
    if (existing) {
      throw new Error("Bus with this plate number already exists");
    }
  }

  if (Number.isFinite(nextCapacity) && nextCapacity > 0) {
    const seatsCount = await prisma.seat.count({ where: { busId } });
    if (nextCapacity < seatsCount) {
      throw new Error("Seat capacity cannot be lower than configured seats");
    }
  }

  return prisma.bus.update({
    where: { id: busId },
    data: {
      ...(nextName ? { name: nextName } : {}),
      ...(nextPlate ? { plateNumber: nextPlate } : {}),
      ...(Number.isFinite(nextCapacity) && nextCapacity > 0 ? { seatCapacity: nextCapacity } : {}),
    },
  });
};

export const setBusActiveState = async (userId, busId, isActive) => {
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

  return prisma.bus.update({
    where: { id: busId },
    data: { isActive: Boolean(isActive) },
  });
};

export const deleteBus = async (userId, busId) => {
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

  const linkedTrips = await prisma.trip.count({ where: { busId } });
  if (linkedTrips > 0) {
    throw new Error("Cannot delete bus with existing trips. Set it inactive instead.");
  }

  await prisma.seat.deleteMany({ where: { busId } });
  await prisma.bus.delete({ where: { id: busId } });

  return { id: busId };
};

export const replaceSeatsForBus = async (userId, busId, seats) => {
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

  if (!Array.isArray(seats) || seats.length === 0) {
    throw new Error("At least one seat is required");
  }

  if (seats.length > bus.seatCapacity) {
    throw new Error("Seats exceed bus capacity");
  }

  const relatedTripIds = (
    await prisma.trip.findMany({
      where: { busId },
      select: { id: true },
    })
  ).map((trip) => trip.id);

  if (relatedTripIds.length > 0) {
    const bookingCount = await prisma.booking.count({
      where: {
        tripId: { in: relatedTripIds },
      },
    });

    if (bookingCount > 0) {
      throw new Error("Cannot change seats for buses with existing bookings");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.seat.deleteMany({ where: { busId } });

    if (seats.length === 0) {
      return [];
    }

    await tx.seat.createMany({
      data: seats.map((seat) => ({
        busId,
        seatNumber: seat.seatNumber,
        seatClass: seat.seatClass,
        price: seat.price,
      })),
    });

    return tx.seat.findMany({
      where: { busId },
      orderBy: { seatNumber: "asc" },
    });
  });
};

export const deleteSeatsForBus = async (userId, busId) => {
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

  const relatedTripIds = (
    await prisma.trip.findMany({
      where: { busId },
      select: { id: true },
    })
  ).map((trip) => trip.id);

  if (relatedTripIds.length > 0) {
    const bookingCount = await prisma.booking.count({
      where: {
        tripId: { in: relatedTripIds },
      },
    });

    if (bookingCount > 0) {
      throw new Error("Cannot delete seats for buses with existing bookings");
    }
  }

  const deleted = await prisma.seat.deleteMany({ where: { busId } });
  return { id: busId, deletedCount: deleted.count };
};