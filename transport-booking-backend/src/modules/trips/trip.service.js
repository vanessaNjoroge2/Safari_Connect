import { prisma } from "../../config/prisma.js";

export const createTrip = async (userId, payload) => {
  const {
    busId,
    routeId,
    tripType = "ONE_WAY",
    departureTime,
    arrivalTime,
    basePrice,
  } = payload;

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
      isActive: true,
    },
    include: {
      seats: true,
    },
  });

  if (!bus) {
    throw new Error("Bus not found or does not belong to your sacco");
  }

  if (bus.seats.length === 0) {
    throw new Error("This bus has no seats configured");
  }

  const route = await prisma.route.findUnique({
    where: { id: routeId },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);

  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
    throw new Error("Invalid departure or arrival time");
  }

  if (arrival <= departure) {
    throw new Error("Arrival time must be after departure time");
  }

  return prisma.trip.create({
    data: {
      saccoId: ownerProfile.sacco.id,
      busId,
      routeId,
      tripType,
      departureTime: departure,
      arrivalTime: arrival,
      basePrice,
    },
    include: {
      sacco: true,
      bus: true,
      route: true,
    },
  });
};

export const getMyTrips = async (userId) => {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  const trips = await prisma.trip.findMany({
    where: {
      saccoId: ownerProfile.sacco.id,
    },
    include: {
      sacco: true,
      bus: true,
      route: true,
      bookings: true,
    },
    orderBy: {
      departureTime: "desc",
    },
  });

  return trips.map((trip) => {
    const bookedSeats = trip.bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED" || booking.status === "PENDING",
    ).length;

    return {
      ...trip,
      bookedSeats,
      availableSeats: trip.bus.seatCapacity - bookedSeats,
    };
  });
};

export const searchTrips = async (query) => {
  const { categoryId, origin, destination, date, time, tripType } = query;

  const where = {
    status: "SCHEDULED",
  };

  if (tripType) {
    where.tripType = tripType;
  }

  if (categoryId) {
    where.sacco = {
      categoryId,
    };
  }

  if (origin || destination) {
    where.route = {};
    if (origin) {
      where.route.origin = {
        equals: origin,
        mode: "insensitive",
      };
    }
    if (destination) {
      where.route.destination = {
        equals: destination,
        mode: "insensitive",
      };
    }
  }

  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    where.departureTime = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  let trips = [];
  try {
    trips = await prisma.trip.findMany({
      where,
      include: {
        sacco: true,
        bus: {
          include: {
            seats: true,
          },
        },
        route: true,
        bookings: true,
      },
      orderBy: {
        departureTime: "asc",
      },
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("public.Route") && message.includes("does not exist")) {
      return [];
    }
    throw error;
  }

  let filteredTrips = trips;

  if (time) {
    filteredTrips = filteredTrips.filter((trip) => {
      const tripTime = trip.departureTime.toISOString().slice(11, 16);
      return tripTime >= time;
    });
  }

  return filteredTrips
    .map((trip) => {
      const bookedSeatIds = trip.bookings
        .filter(
          (booking) =>
            booking.status === "CONFIRMED" || booking.status === "PENDING",
        )
        .map((booking) => booking.seatId);

      const availableSeats = trip.bus.seats.filter(
        (seat) => !bookedSeatIds.includes(seat.id),
      );

      const durationInMinutes = Math.floor(
        (new Date(trip.arrivalTime).getTime() -
          new Date(trip.departureTime).getTime()) /
          (1000 * 60),
      );

      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;

      return {
        id: trip.id,
        tripType: trip.tripType,
        status: trip.status,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        basePrice: trip.basePrice,
        sacco: {
          id: trip.sacco.id,
          name: trip.sacco.name,
          logoUrl: trip.sacco.logoUrl,
        },
        bus: {
          id: trip.bus.id,
          name: trip.bus.name,
          plateNumber: trip.bus.plateNumber,
          seatCapacity: trip.bus.seatCapacity,
        },
        route: {
          id: trip.route.id,
          origin: trip.route.origin,
          destination: trip.route.destination,
          distanceKm: trip.route.distanceKm,
          estimatedTime: trip.route.estimatedTime,
        },
        duration: `${hours}h ${minutes}m`,
        availableSeatsCount: availableSeats.length,
        seatClasses: [...new Set(availableSeats.map((seat) => seat.seatClass))],
      };
    })
    .filter((trip) => trip.availableSeatsCount > 0);
};

export const getTripById = async (tripId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      sacco: true,
      bus: {
        include: {
          seats: true,
        },
      },
      route: true,
      bookings: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const bookedSeatIds = trip.bookings
    .filter(
      (booking) =>
        booking.status === "CONFIRMED" || booking.status === "PENDING",
    )
    .map((booking) => booking.seatId);

  const seats = trip.bus.seats.map((seat) => ({
    id: seat.id,
    seatNumber: seat.seatNumber,
    seatClass: seat.seatClass,
    price: seat.price,
    isBooked: bookedSeatIds.includes(seat.id),
  }));

  const durationInMinutes = Math.floor(
    (new Date(trip.arrivalTime).getTime() -
      new Date(trip.departureTime).getTime()) /
      (1000 * 60),
  );

  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  return {
    id: trip.id,
    tripType: trip.tripType,
    status: trip.status,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    basePrice: trip.basePrice,
    duration: `${hours}h ${minutes}m`,
    sacco: trip.sacco,
    bus: {
      ...trip.bus,
      seats,
    },
    route: trip.route,
    availableSeatsCount: seats.filter((seat) => !seat.isBooked).length,
  };
};

export const updateTripStatus = async (userId, tripId, status) => {
  const allowedStatuses = ["SCHEDULED", "CANCELLED", "COMPLETED"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid trip status");
  }
  
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile || !ownerProfile.sacco) {
    throw new Error("Sacco not found for this owner");
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      saccoId: ownerProfile.sacco.id,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: { status },
    include: {
      sacco: true,
      bus: true,
      route: true,
    },
  });
};
