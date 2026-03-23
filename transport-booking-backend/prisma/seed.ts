import { PrismaClient, Prisma, UserRole, TripStatus, BookingStatus, PaymentStatus, SeatClass } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password123!";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function getDatesFromJanuaryToToday() {
  const dates: Date[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d < todayStart; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

function generateBookingCode() {
  return `BK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function uniqueId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueMpesaRef() {
  return `MPESA${Date.now()}${Math.floor(Math.random() * 100000)}`;
}

function generatePlateNumber(index: number) {
  const prefixes = ["KDA", "KDB", "KDC", "KDD", "KDE", "KDF", "KDG", "KDH"];
  return `${prefixes[index % prefixes.length]} ${100 + index}A`;
}

function buildSeatsForCapacity(capacity: number) {
  const seats: { seatNumber: string; seatClass: SeatClass; price: Prisma.Decimal }[] = [];
  const perRow = 4;
  const rows = Math.ceil(capacity / perRow);
  let current = 0;

  for (let i = 0; i < rows; i++) {
    const rowLetter = String.fromCharCode(65 + i); // A, B, C...
    for (let j = 1; j <= perRow; j++) {
      current++;
      if (current > capacity) break;

      let seatClass: SeatClass = "BUSINESS";
      let price = new Prisma.Decimal(1500);

      if (i === 0) {
        seatClass = "VIP";
        price = new Prisma.Decimal(2500);
      } else if (i <= 2) {
        seatClass = "FIRST_CLASS";
        price = new Prisma.Decimal(2000);
      }

      seats.push({
        seatNumber: `${rowLetter}${j}`,
        seatClass,
        price,
      });
    }
  }

  return seats;
}

function startOfFutureDay(daysAhead: number, hour: number, minute = 0) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const BUSINESS_HOUR_SLOTS = [8, 10, 12, 14, 16, 18] as const;

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function upsertUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified?: boolean;
}) {
  const hashed = await hashPassword(DEFAULT_PASSWORD);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone,
      password: hashed,
      role: params.role,
      isVerified: params.isVerified ?? true,
    },
  });
}

async function getOrCreateRoute(
  origin: string,
  destination: string,
  distanceKm?: number,
  estimatedTime?: number
) {
  const existing = await prisma.route.findFirst({
    where: {
      origin: { equals: origin, mode: "insensitive" },
      destination: { equals: destination, mode: "insensitive" },
    },
  });

  if (existing) return existing;

  return prisma.route.create({
    data: {
      origin,
      destination,
      distanceKm,
      estimatedTime,
    },
  });
}

async function main() {
  console.log("🌱 Starting seed...");

  // Optional cleanup for reruns after testing
  // Uncomment if needed
  // await prisma.payment.deleteMany();
  // await prisma.booking.deleteMany();
  // await prisma.trip.deleteMany();
  // await prisma.seat.deleteMany();
  // await prisma.bus.deleteMany();
  // await prisma.sacco.deleteMany();
  // await prisma.ownerProfile.deleteMany();
  // await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });
  // await prisma.route.deleteMany();
  // await prisma.category.deleteMany();

  // 1. Categories
  const categorySeed = [
    {
      name: "Buses",
      slug: "buses",
      description: "Long distance and public service buses",
    },
    {
      name: "Motorbikes",
      slug: "motorbikes",
      description: "Boda boda and bike transport services",
    },
    {
      name: "Matatu",
      slug: "matatu",
      description: "Matatu and shuttle transport services",
    },
    {
      name: "Carrier Services",
      slug: "carrier-services",
      description: "Parcel and goods carrier services",
    },
  ];

  for (const category of categorySeed) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const busCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "buses" },
  });

  const matatuCategory = await prisma.category.findUniqueOrThrow({
    where: { slug: "matatu" },
  });

  // 2. Admin
  await upsertUser({
    firstName: "System",
    lastName: "Admin",
    email: "admin@transport.com",
    phone: "254700000001",
    role: "ADMIN",
  });

  // 3. Owners + SACCOs
  const ownerSeed = [
    {
      firstName: "John",
      lastName: "Mwangi",
      email: "owner1@transport.com",
      phone: "254700000011",
      saccoName: "Safari Express",
      supportPhone: "254711111111",
      supportEmail: "support@safariexpress.com",
    },
    {
      firstName: "Mary",
      lastName: "Wanjiru",
      email: "owner2@transport.com",
      phone: "254700000012",
      saccoName: "Metro Ride",
      supportPhone: "254722222222",
      supportEmail: "support@metroride.com",
    },
    {
      firstName: "Peter",
      lastName: "Otieno",
      email: "owner3@transport.com",
      phone: "254700000013",
      saccoName: "Coast Shuttle",
      supportPhone: "254733333333",
      supportEmail: "support@coastshuttle.com",
    },
    {
      firstName: "Ann",
      lastName: "Kilonzo",
      email: "owner4@transport.com",
      phone: "254700000014",
      saccoName: "City Link",
      supportPhone: "254744444444",
      supportEmail: "support@citylink.com",
      categorySlug: "buses",
    },
    {
      firstName: "Ben",
      lastName: "Maina",
      email: "owner5@transport.com",
      phone: "254700000015",
      saccoName: "Metro Matatu Line",
      supportPhone: "254755555555",
      supportEmail: "support@metromatatu.co.ke",
      categorySlug: "matatu",
    },
  ];

  const saccos: Awaited<ReturnType<typeof prisma.sacco.create>>[] = [];

  for (const ownerData of ownerSeed) {
    const ownerUser = await upsertUser({
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
      email: ownerData.email,
      phone: ownerData.phone,
      role: "OWNER",
    });

    const ownerProfile = await prisma.ownerProfile.upsert({
      where: { userId: ownerUser.id },
      update: {},
      create: {
        userId: ownerUser.id,
        businessEmail: ownerData.supportEmail,
        businessPhone: ownerData.supportPhone,
      },
    });

    const saccoSlug = slugify(ownerData.saccoName);

    const existingSacco = await prisma.sacco.findUnique({
      where: { slug: saccoSlug },
    });

    const sacco =
      existingSacco ??
      (await prisma.sacco.create({
        data: {
          ownerProfileId: ownerProfile.id,
          categoryId:
            ownerData.categorySlug === "matatu"
              ? matatuCategory.id
              : busCategory.id,
          name: ownerData.saccoName,
          slug: saccoSlug,
          supportPhone: ownerData.supportPhone,
          supportEmail: ownerData.supportEmail,
          isActive: true,
        },
      }));

    saccos.push(sacco);
  }

  // 4. Passengers
  const passengerSeed = [
    ["Clifford", "Mbithuka", "clifford@example.com", "254711000001"],
    ["Brian", "Kimani", "brian@example.com", "254711000002"],
    ["Faith", "Achieng", "faith@example.com", "254711000003"],
    ["Kevin", "Mutua", "kevin@example.com", "254711000004"],
    ["Joy", "Wambui", "joy@example.com", "254711000005"],
    ["Tina", "Njeri", "tina@example.com", "254711000006"],
    ["Sean", "Odhiambo", "sean@example.com", "254711000007"],
    ["Mercy", "Atieno", "mercy@example.com", "254711000008"],
  ];

  const passengers = [];
  for (const [firstName, lastName, email, phone] of passengerSeed) {
    const passenger = await upsertUser({
      firstName,
      lastName,
      email,
      phone,
      role: "USER",
    });
    passengers.push(passenger);
  }

  // 5. Routes
  const routeSeed = [
    ["Nairobi", "Mombasa", 480, 420],
    ["Nairobi", "Kisumu", 350, 360],
    ["Nairobi", "Nakuru", 160, 180],
    ["Thika", "Nairobi", 45, 75],
    ["Nairobi", "Thika", 45, 75],
    ["Nairobi", "Eldoret", 310, 330],
    ["Mombasa", "Nairobi", 480, 420],
    ["Kisumu", "Nairobi", 350, 360],
    ["Nakuru", "Nairobi", 160, 180],
  ] as const;

  const routes = [];
  for (const [origin, destination, distanceKm, estimatedTime] of routeSeed) {
    const route = await getOrCreateRoute(origin, destination, distanceKm, estimatedTime);
    routes.push(route);
  }

  // 6. Buses + Seats
  const buses: Awaited<ReturnType<typeof prisma.bus.create>>[] = [];
  let plateIndex = 0;

  for (const sacco of saccos) {
    for (let i = 0; i < 2; i++) {
      const plateNumber = generatePlateNumber(plateIndex);

      let bus = await prisma.bus.findUnique({
        where: { plateNumber },
      });

      if (!bus) {
        bus = await prisma.bus.create({
          data: {
            saccoId: sacco.id,
            name: `${sacco.name} Bus ${i + 1}`,
            plateNumber,
            seatCapacity: 24,
            isActive: true,
          },
        });
      }

      const existingSeats = await prisma.seat.findMany({
        where: { busId: bus.id },
      });

      if (existingSeats.length === 0) {
        const seats = buildSeatsForCapacity(24);
        await prisma.seat.createMany({
          data: seats.map((seat) => ({
            busId: bus.id,
            seatNumber: seat.seatNumber,
            seatClass: seat.seatClass,
            price: seat.price,
          })),
        });
      }

      buses.push(bus);
      plateIndex++;
    }
  }

  // 6b. Deterministic fleet + popular routes for first owner (John / Safari Express)
  const johnSacco = saccos.find((s) => s.slug === slugify("Safari Express"));
  if (johnSacco) {
    const johnFleetBlueprint = [
      { name: "Safari Express Executive Coach", plateNumber: "KSA 101J", seatCapacity: 51 },
      { name: "Safari Express City Shuttle", plateNumber: "KSA 102J", seatCapacity: 33 },
      { name: "Safari Express Commuter Van", plateNumber: "KSA 103J", seatCapacity: 14 },
      { name: "Safari Express Intercity Bus", plateNumber: "KSA 104J", seatCapacity: 24 },
    ];

    const johnBuses: Awaited<ReturnType<typeof prisma.bus.create>>[] = [];
    for (const bp of johnFleetBlueprint) {
      let bus = await prisma.bus.findUnique({ where: { plateNumber: bp.plateNumber } });
      if (!bus) {
        bus = await prisma.bus.create({
          data: {
            saccoId: johnSacco.id,
            name: bp.name,
            plateNumber: bp.plateNumber,
            seatCapacity: bp.seatCapacity,
            isActive: true,
          },
        });
      }

      const busSeats = await prisma.seat.findMany({ where: { busId: bus.id } });
      if (busSeats.length === 0) {
        const seats = buildSeatsForCapacity(bp.seatCapacity);
        await prisma.seat.createMany({
          data: seats.map((seat) => ({
            busId: bus.id,
            seatNumber: seat.seatNumber,
            seatClass: seat.seatClass,
            price: seat.price,
          })),
        });
      }

      johnBuses.push(bus);
    }

    const popularRouteDefs = [
      ["Nairobi", "Nakuru", 160, 180],
      ["Nairobi", "Mombasa", 480, 420],
      ["Nairobi", "Kisumu", 350, 360],
      ["Nairobi", "Eldoret", 310, 330],
    ] as const;

    const johnPopularRoutes = [];
    for (const [origin, destination, distanceKm, estimatedTime] of popularRouteDefs) {
      const route = await getOrCreateRoute(origin, destination, distanceKm, estimatedTime);
      johnPopularRoutes.push(route);
    }

    for (let dayAhead = 1; dayAhead <= 14; dayAhead++) {
      for (let routeIndex = 0; routeIndex < johnPopularRoutes.length; routeIndex++) {
        const route = johnPopularRoutes[routeIndex];
        const bus = johnBuses[(dayAhead + routeIndex) % johnBuses.length];

        const departureSlots =
          dayAhead <= 2
            ? [...BUSINESS_HOUR_SLOTS]
            : route.origin === "Nairobi" && route.destination === "Nakuru"
              ? [6, 9, 14, 18]
              : [7, 13];

        for (const hour of departureSlots) {
          const departureTime = startOfFutureDay(dayAhead, hour);
          const arrivalTime = addMinutes(departureTime, route.estimatedTime || 180);

          const existingTrip = await prisma.trip.findFirst({
            where: {
              saccoId: johnSacco.id,
              busId: bus.id,
              routeId: route.id,
              departureTime,
            },
          });

          if (!existingTrip) {
            await prisma.trip.create({
              data: {
                saccoId: johnSacco.id,
                busId: bus.id,
                routeId: route.id,
                tripType: "ONE_WAY",
                departureTime,
                arrivalTime,
                basePrice:
                  route.destination === "Nakuru"
                    ? new Prisma.Decimal(900)
                    : route.destination === "Mombasa"
                      ? new Prisma.Decimal(2200)
                      : route.destination === "Kisumu"
                        ? new Prisma.Decimal(1700)
                        : new Prisma.Decimal(1600),
                aiAnalysis:
                  "AI trip analysis: high-demand owner route seeded for Safari Express to support live dashboard recommendations.",
                status: "SCHEDULED",
              },
            });
          }
        }
      }
    }
  }

  // 7. Trips from January to today
  const dates = getDatesFromJanuaryToToday();
  const createdTrips: Array<{ id: string; busId: string; departureTime: Date }> = [];

  for (const sacco of saccos) {
    const saccoBuses = await prisma.bus.findMany({
      where: { saccoId: sacco.id },
    });

    for (const day of dates) {
      const tripsToday = randomInt(1, 2);

      for (let i = 0; i < tripsToday; i++) {
        const bus = randomFrom(saccoBuses);
        const route = randomFrom(routes);
        const departureHour = randomFrom([6, 8, 10, 14, 18, 20]);

        const departureTime = new Date(day);
        departureTime.setHours(departureHour, 0, 0, 0);

        const arrivalTime = addMinutes(departureTime, route.estimatedTime || 180);

        const trip = await prisma.trip.create({
          data: {
            saccoId: sacco.id,
            busId: bus.id,
            routeId: route.id,
            tripType: "ONE_WAY",
            departureTime,
            arrivalTime,
            basePrice: new Prisma.Decimal(randomFrom([1500, 1800, 2000, 2500])),
            aiAnalysis: `AI trip analysis: seeded demand profile for ${route.origin} -> ${route.destination}; monitor occupancy and delay risk before departure.`,
            status:
              departureTime < new Date()
                ? randomFrom<TripStatus[]>(["COMPLETED", "COMPLETED", "SCHEDULED"])
                : "SCHEDULED",
          },
        });

        createdTrips.push({
          id: trip.id,
          busId: trip.busId,
          departureTime: trip.departureTime,
        });
      }
    }
  }

  // 7a. Deterministic vehicle schedule for today, tomorrow, and day-after-tomorrow (8am to 6pm)
  const windowStart = startOfFutureDay(0, 0);
  const windowEnd = startOfFutureDay(3, 0);
  const allowedHours = new Set<number>([...BUSINESS_HOUR_SLOTS]);

  const windowTrips = await prisma.trip.findMany({
    where: {
      departureTime: {
        gte: windowStart,
        lt: windowEnd,
      },
    },
    select: {
      id: true,
      departureTime: true,
      bookings: {
        select: {
          id: true,
          payment: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const offWindowTripIds: string[] = [];
  const offWindowBookingIds: string[] = [];
  const offWindowPaymentIds: string[] = [];

  for (const trip of windowTrips) {
    const hour = new Date(trip.departureTime).getHours();
    if (allowedHours.has(hour)) continue;

    offWindowTripIds.push(trip.id);
    for (const booking of trip.bookings) {
      offWindowBookingIds.push(booking.id);
      if (booking.payment?.id) {
        offWindowPaymentIds.push(booking.payment.id);
      }
    }
  }

  if (offWindowPaymentIds.length > 0) {
    await prisma.payment.deleteMany({
      where: {
        id: { in: offWindowPaymentIds },
      },
    });
  }

  if (offWindowBookingIds.length > 0) {
    await prisma.booking.deleteMany({
      where: {
        id: { in: offWindowBookingIds },
      },
    });
  }

  if (offWindowTripIds.length > 0) {
    await prisma.trip.deleteMany({
      where: {
        id: { in: offWindowTripIds },
      },
    });
  }

  console.log(`Pruned off-window trips in 3-day window: ${offWindowTripIds.length}`);

  const allActiveBuses = await prisma.bus.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  let futureWindowTripsCreated = 0;
  for (let dayAhead = 0; dayAhead <= 2; dayAhead++) {
    for (let busIndex = 0; busIndex < allActiveBuses.length; busIndex++) {
      const bus = allActiveBuses[busIndex];

      for (let slotIndex = 0; slotIndex < BUSINESS_HOUR_SLOTS.length; slotIndex++) {
        const departureHour = BUSINESS_HOUR_SLOTS[slotIndex];
        const route = routes[(busIndex + dayAhead + slotIndex) % routes.length];
        const departureTime = startOfFutureDay(dayAhead, departureHour);
        const arrivalTime = addMinutes(departureTime, route.estimatedTime || 180);

        const existingTrip = await prisma.trip.findFirst({
          where: {
            saccoId: bus.saccoId,
            busId: bus.id,
            routeId: route.id,
            departureTime,
          },
        });

        if (existingTrip) continue;

        await prisma.trip.create({
          data: {
            saccoId: bus.saccoId,
            busId: bus.id,
            routeId: route.id,
            tripType: "ONE_WAY",
            departureTime,
            arrivalTime,
            basePrice: new Prisma.Decimal(randomFrom([900, 1200, 1500, 1800, 2200])),
            aiAnalysis:
              "AI trip analysis: deterministic schedule seeded for today/tomorrow/day+2 in business-hour window (08:00-18:00).",
            status: "SCHEDULED",
          },
        });

        futureWindowTripsCreated++;
      }
    }
  }

  console.log(`Future window trips (today+2 days, 08:00-18:00) created: ${futureWindowTripsCreated}`);

  // 8. Bookings + Payments
  for (const trip of createdTrips) {
    const busSeats = await prisma.seat.findMany({
      where: { busId: trip.busId },
    });

    const seatsToBook = randomInt(2, 8);
    const usedSeatIds = new Set<string>();

    for (let i = 0; i < seatsToBook; i++) {
      const passenger = randomFrom(passengers);
      const seat = randomFrom(busSeats);

      if (usedSeatIds.has(seat.id)) continue;
      usedSeatIds.add(seat.id);

      const bookingStatus: BookingStatus =
        trip.departureTime < new Date()
          ? randomFrom<BookingStatus[]>(["CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED"])
          : randomFrom<BookingStatus[]>(["PENDING", "CONFIRMED"]);

      const booking = await prisma.booking.create({
        data: {
          userId: passenger.id,
          tripId: trip.id,
          seatId: seat.id,
          bookingCode: generateBookingCode(),
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          email: passenger.email,
          phone: passenger.phone || "254700000000",
          nationalId: `${randomInt(10000000, 39999999)}`,
          residence: randomFrom(["Nairobi", "Thika", "Mombasa", "Kisumu", "Nakuru"]),
          amount: seat.price,
          aiAnalysis:
            bookingStatus === "CONFIRMED"
              ? "AI booking analysis: payment likely healthy; booking can remain confirmed unless later anomaly detected."
              : bookingStatus === "PENDING"
                ? "AI booking analysis: awaiting payment confirmation; keep seat locked temporarily and monitor timeout."
                : "AI booking analysis: booking cancelled; release seat inventory and audit cancellation pattern.",
          status: bookingStatus,
        },
      });

      if (bookingStatus === "CONFIRMED" || bookingStatus === "PENDING") {
        const paymentStatus: PaymentStatus =
          bookingStatus === "CONFIRMED"
            ? "SUCCESS"
            : randomFrom<PaymentStatus[]>(["PENDING", "FAILED"]);

        await prisma.payment.create({
          data: {
            userId: passenger.id,
            bookingId: booking.id,
            method: "MPESA",
            amount: seat.price,
            phoneNumber: passenger.phone || "254700000000",
            transactionRef: paymentStatus === "SUCCESS" ? uniqueMpesaRef() : null,
            checkoutRequestId: uniqueId("ws_CO"),
            merchantRequestId: uniqueId("MR"),
            aiAnalysis:
              paymentStatus === "SUCCESS"
                ? "AI payment analysis: successful mobile money confirmation; trust risk low."
                : paymentStatus === "FAILED"
                  ? "AI payment analysis: failed payment event; prompt retry and risk-check repeated failures."
                  : "AI payment analysis: pending callback from payment provider.",
            status: paymentStatus,
          },
        });
      }
    }
  }

  // 9. Deterministic demo scenarios for full walkthroughs (idempotent)
  const demoRoute = await getOrCreateRoute("Nairobi (Demo Hub)", "Nakuru (Demo Hub)", 160, 180);
  const demoSacco = saccos[0];
  const matatuSacco = saccos.find((s) => s.slug === slugify("Metro Matatu Line"));

  let demoBus = await prisma.bus.findUnique({
    where: { plateNumber: "KDM 900D" },
  });

  if (!demoBus) {
    demoBus = await prisma.bus.create({
      data: {
        saccoId: demoSacco.id,
        name: "Safari Express Demo Bus",
        plateNumber: "KDM 900D",
        seatCapacity: 24,
        isActive: true,
      },
    });
  }

  const demoBusSeats = await prisma.seat.findMany({
    where: { busId: demoBus.id },
    orderBy: { seatNumber: "asc" },
  });

  if (demoBusSeats.length === 0) {
    const seats = buildSeatsForCapacity(24);
    await prisma.seat.createMany({
      data: seats.map((seat) => ({
        busId: demoBus!.id,
        seatNumber: seat.seatNumber,
        seatClass: seat.seatClass,
        price: seat.price,
      })),
    });
  }

  const refreshedDemoSeats = await prisma.seat.findMany({
    where: { busId: demoBus.id },
    orderBy: { seatNumber: "asc" },
  });

  const demoTripsSeed = [
    {
      code: "TRIP-DEMO-RECO",
      departureTime: startOfFutureDay(1, 8),
      arrivalTime: startOfFutureDay(1, 11),
      basePrice: new Prisma.Decimal(1500),
      status: "SCHEDULED" as TripStatus,
    },
    {
      code: "TRIP-DEMO-PRICE",
      departureTime: startOfFutureDay(1, 18),
      arrivalTime: startOfFutureDay(1, 21),
      basePrice: new Prisma.Decimal(1800),
      status: "SCHEDULED" as TripStatus,
    },
    {
      code: "TRIP-DEMO-RISK",
      departureTime: startOfFutureDay(2, 8),
      arrivalTime: startOfFutureDay(2, 11),
      basePrice: new Prisma.Decimal(2100),
      status: "SCHEDULED" as TripStatus,
    },
  ];

  const demoTrips: Record<string, Awaited<ReturnType<typeof prisma.trip.create>>> = {};
  for (const t of demoTripsSeed) {
    const existing = await prisma.trip.findFirst({
      where: {
        busId: demoBus.id,
        routeId: demoRoute.id,
        departureTime: t.departureTime,
      },
    });

    const trip =
      existing ??
      (await prisma.trip.create({
        data: {
          saccoId: demoSacco.id,
          busId: demoBus.id,
          routeId: demoRoute.id,
          tripType: "ONE_WAY",
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          basePrice: t.basePrice,
          aiAnalysis: `AI demo analysis: ${t.code} prepared for recommendation, pricing, and delay-risk showcase.`,
          status: t.status,
        },
      }));

    demoTrips[t.code] = trip;
  }

  // Deterministic matatu demo trip for category-specific search demos
  if (matatuSacco) {
    let matatuBus = await prisma.bus.findUnique({
      where: { plateNumber: "KMT 101M" },
    });

    if (!matatuBus) {
      matatuBus = await prisma.bus.create({
        data: {
          saccoId: matatuSacco.id,
          name: "Metro Matatu Demo Van",
          plateNumber: "KMT 101M",
          seatCapacity: 14,
          isActive: true,
        },
      });
    }

    const matatuSeats = await prisma.seat.findMany({ where: { busId: matatuBus.id } });
    if (matatuSeats.length === 0) {
      const seats = buildSeatsForCapacity(14);
      await prisma.seat.createMany({
        data: seats.map((seat) => ({
          busId: matatuBus!.id,
          seatNumber: seat.seatNumber,
          seatClass: seat.seatClass,
          price: new Prisma.Decimal(750),
        })),
      });
    }

    const matatuDemoDeparture = startOfFutureDay(1, 8);
    const existingMatatuDemoTrip = await prisma.trip.findFirst({
      where: {
        saccoId: matatuSacco.id,
        busId: matatuBus.id,
        routeId: routes.find((r) => r.origin === "Nairobi" && r.destination === "Nakuru")?.id,
        departureTime: matatuDemoDeparture,
      },
    });

    const nairobiNakuru = routes.find((r) => r.origin === "Nairobi" && r.destination === "Nakuru");
    if (nairobiNakuru && !existingMatatuDemoTrip) {
      await prisma.trip.create({
        data: {
          saccoId: matatuSacco.id,
          busId: matatuBus.id,
          routeId: nairobiNakuru.id,
          tripType: "ONE_WAY",
          departureTime: matatuDemoDeparture,
          arrivalTime: addMinutes(matatuDemoDeparture, nairobiNakuru.estimatedTime || 180),
          basePrice: new Prisma.Decimal(750),
          aiAnalysis:
            "AI demo analysis: dedicated matatu scenario for route-level recommendation and demand showcases.",
          status: "SCHEDULED",
        },
      });
    }
  }

  const demoPassengers = {
    normal: passengers.find((p) => p.email === "clifford@example.com") || passengers[0],
    review: passengers.find((p) => p.email === "faith@example.com") || passengers[1],
    blocked: passengers.find((p) => p.email === "brian@example.com") || passengers[2],
  };

  const seatByNumber = (seatNumber: string) => {
    const seat = refreshedDemoSeats.find((s) => s.seatNumber === seatNumber);
    if (!seat) throw new Error(`Expected demo seat ${seatNumber} not found`);
    return seat;
  };

  const demoBookingsSeed: Array<{
    bookingCode: string;
    userId: string;
    tripCode: string;
    seatNumber: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    nationalId: string;
    residence: string;
  }> = [
    {
      bookingCode: "DEMO-BOOK-ALLOW-001",
      userId: demoPassengers.normal.id,
      tripCode: "TRIP-DEMO-RECO",
      seatNumber: "A1",
      status: "CONFIRMED",
      paymentStatus: "SUCCESS",
      nationalId: "30010001",
      residence: "Nairobi",
    },
    {
      bookingCode: "DEMO-BOOK-REVIEW-002",
      userId: demoPassengers.review.id,
      tripCode: "TRIP-DEMO-PRICE",
      seatNumber: "A2",
      status: "PENDING",
      paymentStatus: "FAILED",
      nationalId: "30010002",
      residence: "Nakuru",
    },
    {
      bookingCode: "DEMO-BOOK-BLOCK-003",
      userId: demoPassengers.blocked.id,
      tripCode: "TRIP-DEMO-RISK",
      seatNumber: "A3",
      status: "CANCELLED",
      paymentStatus: "FAILED",
      nationalId: "30010003",
      residence: "Kisumu",
    },
  ];

  for (const demo of demoBookingsSeed) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: demo.userId } });
    const seat = seatByNumber(demo.seatNumber);
    const trip = demoTrips[demo.tripCode];

    const booking = await prisma.booking.upsert({
      where: { bookingCode: demo.bookingCode },
      update: {
        status: demo.status,
        tripId: trip.id,
        seatId: seat.id,
        amount: seat.price,
        aiAnalysis:
          demo.status === "CONFIRMED"
            ? "AI demo analysis: allow scenario passed, booking confirmed after trusted payment."
            : demo.status === "PENDING"
              ? "AI demo analysis: review scenario detected, hold booking in pending while payment risk is re-checked."
              : "AI demo analysis: block scenario triggered; booking cancelled to protect platform trust.",
      },
      create: {
        userId: user.id,
        tripId: trip.id,
        seatId: seat.id,
        bookingCode: demo.bookingCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "254700000000",
        nationalId: demo.nationalId,
        residence: demo.residence,
        amount: seat.price,
        aiAnalysis:
          demo.status === "CONFIRMED"
            ? "AI demo analysis: allow scenario passed, booking confirmed after trusted payment."
            : demo.status === "PENDING"
              ? "AI demo analysis: review scenario detected, hold booking in pending while payment risk is re-checked."
              : "AI demo analysis: block scenario triggered; booking cancelled to protect platform trust.",
        status: demo.status,
      },
    });

    const transactionRef =
      demo.paymentStatus === "SUCCESS" ? `DEMO-MPESA-${demo.bookingCode}` : null;
    const checkoutRequestId = `DEMO-CO-${demo.bookingCode}`;
    const merchantRequestId = `DEMO-MR-${demo.bookingCode}`;

    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        status: demo.paymentStatus,
        amount: seat.price,
        phoneNumber: user.phone || "254700000000",
        transactionRef,
        checkoutRequestId,
        merchantRequestId,
        aiAnalysis:
          demo.paymentStatus === "SUCCESS"
            ? "AI demo payment analysis: trusted payment completed, confidence high."
            : "AI demo payment analysis: failed payment captured for review/block demonstration.",
      },
      create: {
        userId: user.id,
        bookingId: booking.id,
        method: "MPESA",
        amount: seat.price,
        phoneNumber: user.phone || "254700000000",
        transactionRef,
        checkoutRequestId,
        merchantRequestId,
        aiAnalysis:
          demo.paymentStatus === "SUCCESS"
            ? "AI demo payment analysis: trusted payment completed, confidence high."
            : "AI demo payment analysis: failed payment captured for review/block demonstration.",
        status: demo.paymentStatus,
      },
    });
  }

  // 10. Backfill AI analysis fields for any legacy records seeded before aiAnalysis existed
  await prisma.trip.updateMany({
    where: { aiAnalysis: null },
    data: {
      aiAnalysis:
        "AI trip analysis: baseline journey intelligence prepared for pricing, delay, and occupancy monitoring.",
    },
  });

  await prisma.booking.updateMany({
    where: { aiAnalysis: null },
    data: {
      aiAnalysis:
        "AI booking analysis: lifecycle state recorded for trust, fraud, and payment progression checks.",
    },
  });

  await prisma.payment.updateMany({
    where: { aiAnalysis: null },
    data: {
      aiAnalysis:
        "AI payment analysis: transaction state captured for anomaly scoring and confirmation workflow.",
    },
  });

  console.log("✅ Seed completed successfully");
  console.log(`Categories: ${await prisma.category.count()}`);
  console.log(`Users: ${await prisma.user.count()}`);
  console.log(`Owner Profiles: ${await prisma.ownerProfile.count()}`);
  console.log(`Saccos: ${await prisma.sacco.count()}`);
  console.log(`Routes: ${await prisma.route.count()}`);
  console.log(`Buses: ${await prisma.bus.count()}`);
  console.log(`Seats: ${await prisma.seat.count()}`);
  console.log(`Trips: ${await prisma.trip.count()}`);
  console.log(`Bookings: ${await prisma.booking.count()}`);
  console.log(`Payments: ${await prisma.payment.count()}`);
  console.log("Demo booking codes:");
  console.log("- DEMO-BOOK-ALLOW-001 (confirmed + payment success)");
  console.log("- DEMO-BOOK-REVIEW-002 (pending + payment failed)");
  console.log("- DEMO-BOOK-BLOCK-003 (cancelled + payment failed)");
  console.log(`Default password for all seeded users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });