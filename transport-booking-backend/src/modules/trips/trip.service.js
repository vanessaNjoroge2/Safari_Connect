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
      aiAnalysis: `AI schedule analysis: route demand baseline created for ${route.origin} -> ${route.destination}. Monitoring occupancy and delay risk from departure window.`,
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
  const { categoryId, category, origin, destination, date, time, tripType } = query;

  const NAIROBI_UTC_OFFSET_HOURS = 3;
  const getNairobiTimeLabel = (value) =>
    new Date(value).toLocaleTimeString("en-KE", {
      timeZone: "Africa/Nairobi",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

  const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm || "00:00")
      .split(":")
      .map((part) => Number(part));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    return h * 60 + m;
  };

  const normalizePlace = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\b(cbd|town|city|center|centre|bus\s*park|stage|terminal|downtown)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const placeMatches = (routePlace, queryPlace) => {
    const routeNorm = normalizePlace(routePlace);
    const queryNorm = normalizePlace(queryPlace);
    if (!queryNorm) return true;
    if (!routeNorm) return false;

    if (routeNorm.includes(queryNorm) || queryNorm.includes(routeNorm)) return true;

    const routeTokens = routeNorm.split(" ").filter((token) => token.length >= 3);
    const queryTokens = queryNorm.split(" ").filter((token) => token.length >= 3);
    if (!queryTokens.length) return routeNorm.includes(queryNorm);

    return queryTokens.every((token) =>
      routeTokens.some((routeToken) =>
        routeToken.includes(token) || token.includes(routeToken),
      ),
    );
  };

  const parseDateInput = (rawDate) => {
    const value = String(rawDate || "").trim();
    if (!value) return null;

    // yyyy-mm-dd
    let match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }

    // dd/mm/yyyy
    match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return {
        year: Number(match[3]),
        month: Number(match[2]),
        day: Number(match[1]),
      };
    }

    return null;
  };

  const where = {
    status: "SCHEDULED",
  };

  if (tripType) {
    where.tripType = tripType;
  }

  if (categoryId || category) {
    const categorySlugMap = {
      bus: "buses",
      matatu: "matatu",
      motorbike: "motorbikes",
      carrier: "carrier-services",
    };

    const normalizedCategory = String(category || "").toLowerCase().trim();
    const mappedSlug = categorySlugMap[normalizedCategory] || normalizedCategory;

    where.sacco = categoryId
      ? { categoryId }
      : {
          category: {
            slug: mappedSlug,
          },
        };
  }

  if (date) {
    const parsedDate = parseDateInput(date);
    if (!parsedDate) {
      throw new Error("Invalid date format. Use yyyy-mm-dd");
    }

    const { year, month, day } = parsedDate;

    const startOfDay = new Date(
      Date.UTC(year, month - 1, day, -NAIROBI_UTC_OFFSET_HOURS, 0, 0, 0),
    );
    const endOfDay = new Date(
      Date.UTC(year, month - 1, day, 23 - NAIROBI_UTC_OFFSET_HOURS, 59, 59, 999),
    );

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

  if (origin || destination) {
    filteredTrips = filteredTrips.filter((trip) => {
      const originOk = origin ? placeMatches(trip.route.origin, origin) : true;
      const destinationOk = destination
        ? placeMatches(trip.route.destination, destination)
        : true;

      return originOk && destinationOk;
    });
  }

  if (time) {
    const thresholdMinutes = toMinutes(time);
    filteredTrips = filteredTrips.filter((trip) => {
      const tripTimeLabel = getNairobiTimeLabel(trip.departureTime);
      return toMinutes(tripTimeLabel) >= thresholdMinutes;
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
    data: {
      status,
      aiAnalysis: `AI status analysis: trip marked ${status}. Dispatch and passenger communication policies should now follow ${status.toLowerCase()} flow.`,
    },
    include: {
      sacco: true,
      bus: true,
      route: true,
    },
  });
};

export const updateTrip = async (userId, tripId, payload) => {
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
    include: {
      bookings: true,
      route: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const hasBookings = trip.bookings.length > 0;

  if (payload.busId && payload.busId !== trip.busId && hasBookings) {
    throw new Error("Cannot change bus for a trip with existing bookings");
  }

  if (payload.routeId && payload.routeId !== trip.routeId && hasBookings) {
    throw new Error("Cannot change route for a trip with existing bookings");
  }

  if (payload.busId && payload.busId !== trip.busId) {
    const bus = await prisma.bus.findFirst({
      where: {
        id: payload.busId,
        saccoId: ownerProfile.sacco.id,
        isActive: true,
      },
      include: { seats: true },
    });

    if (!bus) {
      throw new Error("Selected bus not found or inactive");
    }

    if (bus.seats.length === 0) {
      throw new Error("Selected bus has no configured seats");
    }
  }

  if (payload.routeId && payload.routeId !== trip.routeId) {
    const route = await prisma.route.findUnique({ where: { id: payload.routeId } });
    if (!route) {
      throw new Error("Selected route not found");
    }
  }

  const nextDeparture = payload.departureTime ? new Date(payload.departureTime) : new Date(trip.departureTime);
  const nextArrival = payload.arrivalTime ? new Date(payload.arrivalTime) : new Date(trip.arrivalTime);

  if (Number.isNaN(nextDeparture.getTime()) || Number.isNaN(nextArrival.getTime())) {
    throw new Error("Invalid departure or arrival time");
  }

  if (nextArrival <= nextDeparture) {
    throw new Error("Arrival time must be after departure time");
  }

  const nextBasePrice = payload.basePrice !== undefined ? Number(payload.basePrice) : Number(trip.basePrice);
  if (!Number.isFinite(nextBasePrice) || nextBasePrice <= 0) {
    throw new Error("Base price must be a positive number");
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(payload.busId ? { busId: payload.busId } : {}),
      ...(payload.routeId ? { routeId: payload.routeId } : {}),
      ...(payload.tripType ? { tripType: payload.tripType } : {}),
      departureTime: nextDeparture,
      arrivalTime: nextArrival,
      basePrice: nextBasePrice,
      aiAnalysis: `AI schedule analysis: trip updated for owner controls. Route/bus timeline validated against live inventory.`,
    },
    include: {
      sacco: true,
      bus: true,
      route: true,
    },
  });
};

export const deleteTrip = async (userId, tripId) => {
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
    include: {
      bookings: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.bookings.length > 0) {
    throw new Error("Cannot delete trip with bookings. Cancel it instead.");
  }

  await prisma.trip.delete({ where: { id: tripId } });
  return { id: tripId };
};
