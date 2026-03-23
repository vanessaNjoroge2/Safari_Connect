import { prisma } from "../../config/prisma.js";

const generateBookingCode = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BK-${random}`;
};

export const getTripSeats = async (tripId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: {
        include: {
          seats: true,
        },
      },
      bookings: true,
      sacco: true,
      route: true,
    },
  });
  console.log("Trip fetched in getTripSeats:", {
    id: trip?.id,
    status: trip?.status,
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status !== "SCHEDULED") {
    throw new Error("This trip is not available for booking");
  }

  const bookedSeatIds = trip.bookings
    .filter(
      (booking) =>
        booking.status === "PENDING" || booking.status === "CONFIRMED"
    )
    .map((booking) => booking.seatId);

  const seats = trip.bus.seats.map((seat) => ({
    id: seat.id,
    seatNumber: seat.seatNumber,
    seatClass: seat.seatClass,
    price: seat.price,
    isBooked: bookedSeatIds.includes(seat.id),
  }));

  return {
    trip: {
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      tripType: trip.tripType,
      status: trip.status,
      sacco: {
        id: trip.sacco.id,
        name: trip.sacco.name,
        logoUrl: trip.sacco.logoUrl,
      },
      route: {
        id: trip.route.id,
        origin: trip.route.origin,
        destination: trip.route.destination,
      },
      bus: {
        id: trip.bus.id,
        name: trip.bus.name,
        plateNumber: trip.bus.plateNumber,
      },
    },
    seats,
  };
};

export const createBooking = async (userId, payload) => {
  const {
    tripId,
    seatId,
    firstName,
    lastName,
    email,
    phone,
    nationalId,
    residence,
  } = payload;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: true,
      sacco: true,
      bus: {
        include: {
          seats: true,
        },
      },
      bookings: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status !== "SCHEDULED") {
    throw new Error("Trip is not available for booking");
  }

  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
  });

  if (!seat) {
    throw new Error("Seat not found");
  }

  if (seat.busId !== trip.busId) {
    throw new Error("Selected seat does not belong to this trip's bus");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      tripId,
      seatId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
  });

  if (existingBooking) {
    throw new Error("This seat is already booked");
  }

  let bookingCode = generateBookingCode();
  while (await prisma.booking.findUnique({ where: { bookingCode } })) {
    bookingCode = generateBookingCode();
  }

  const ticketSnapshot = {
    bookingCode,
    passenger: {
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      residence,
    },
    trip: {
      route: {
        origin: trip.route.origin,
        destination: trip.route.destination,
      },
      sacco: {
        id: trip.sacco.id,
        name: trip.sacco.name,
      },
      bus: {
        id: trip.bus.id,
        name: trip.bus.name,
        plateNumber: trip.bus.plateNumber,
      },
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      tripType: trip.tripType,
    },
    seat: {
      id: seat.id,
      seatNumber: seat.seatNumber,
      seatClass: seat.seatClass,
      price: seat.price,
    },
    payment: {
      amount: seat.price,
      status: "PENDING",
      transactionRef: null,
      updatedAt: new Date(),
    },
    issuedAt: new Date(),
    version: 1,
  };

  const booking = await prisma.booking.create({
    data: {
      userId,
      tripId,
      seatId,
      bookingCode,
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      residence,
      amount: seat.price,
      ticketSnapshot,
      status: "PENDING",
      aiAnalysis:
        "AI booking analysis: booking created in pending state. Risk posture is normal; awaiting payment confirmation before seat lock upgrade to confirmed.",
    },
    include: {
      trip: {
        include: {
          sacco: true,
          route: true,
          bus: true,
        },
      },
      seat: true,
      payment: true,
    },
  });

  return booking;
};

export const getMyBookings = async (userId) => {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      trip: {
        include: {
          sacco: true,
          route: true,
          bus: true,
        },
      },
      seat: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getBookingById = async (userId, bookingId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: {
      trip: {
        include: {
          sacco: true,
          route: true,
          bus: true,
        },
      },
      seat: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
};

export const getBookingAutofill = async (userId) => {
  const [latestBooking, user] = await Promise.all([
    prisma.booking.findFirst({
      where: { userId },
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    }),
  ]);

  const passenger = {
    firstName: latestBooking?.firstName || user?.firstName || "",
    lastName: latestBooking?.lastName || user?.lastName || "",
    idNumber: latestBooking?.nationalId || "",
    residence: latestBooking?.residence || "",
    email: latestBooking?.email || user?.email || "",
  };

  return {
    source: latestBooking ? "recent_booking" : "account_profile",
    passenger,
    phone: latestBooking?.phone || user?.phone || "",
    lastRoute: latestBooking?.trip?.route
      ? {
          from: latestBooking.trip.route.origin,
          to: latestBooking.trip.route.destination,
        }
      : null,
    lastTravelDate: latestBooking?.trip?.departureTime || null,
  };
};
