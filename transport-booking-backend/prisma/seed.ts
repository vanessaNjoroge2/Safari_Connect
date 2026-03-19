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
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
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
          categoryId: busCategory.id,
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
            status: paymentStatus,
          },
        });
      }
    }
  }

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