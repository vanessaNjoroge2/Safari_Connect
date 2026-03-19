import { prisma } from "../../config/prisma.js";
import slugify from "slugify";
import { hashPassword } from "../../utils/hash.js";

function toMoney(value) {
	const n = Number(value || 0);
	return Number.isFinite(n) ? n : 0;
}

function startOfDay(date = new Date()) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date = new Date()) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatRoute(booking) {
	return `${booking.trip?.route?.origin || "-"} -> ${booking.trip?.route?.destination || "-"}`;
}

function formatPassenger(booking) {
	const full = `${booking.firstName || ""} ${booking.lastName || ""}`.trim();
	return full || booking.email || "Unknown passenger";
}

function bookingStatusLabel(booking) {
	if (booking.status === "CONFIRMED") return "Completed";
	if (booking.status === "CANCELLED") return "Cancelled";
	if (booking.payment?.status === "FAILED") return "Disputed";
	if (booking.payment?.status === "SUCCESS") return "On Route";
	return "Upcoming";
}

function paymentStatusLabel(payment) {
	if (payment.status === "SUCCESS") return "Settled";
	if (payment.status === "REFUNDED") return "Refunded";
	if (payment.status === "FAILED") return "Disputed";
	return "Pending";
}

export async function getAdminDashboard() {
	const now = new Date();
	const todayStart = startOfDay(now);
	const monthStart = startOfMonth(now);

	const [
		totalUsers,
		activeSaccos,
		pendingSaccos,
		bookingsToday,
		failedPaymentsToday,
		activeTrips,
		openDisputes,
		grossRevenueAggregate,
		settledPayments,
		topRouteBookings,
	] = await Promise.all([
		prisma.user.count(),
		prisma.sacco.count({ where: { isActive: true } }),
		prisma.sacco.count({ where: { isActive: false } }),
		prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
		prisma.payment.count({ where: { status: "FAILED", createdAt: { gte: todayStart } } }),
		prisma.trip.count({ where: { status: "SCHEDULED", departureTime: { gte: now } } }),
		prisma.payment.count({ where: { status: "FAILED" } }),
		prisma.payment.aggregate({
			_sum: { amount: true },
			where: { status: "SUCCESS", createdAt: { gte: monthStart } },
		}),
		prisma.payment.findMany({
			where: { status: "SUCCESS", createdAt: { gte: monthStart } },
			select: { amount: true },
		}),
		prisma.booking.findMany({
			include: {
				trip: {
					include: {
						route: true,
					},
				},
			},
			take: 1000,
			orderBy: { createdAt: "desc" },
		}),
	]);

	const grossRevenue = toMoney(grossRevenueAggregate?._sum?.amount);
	const commission = settledPayments.reduce((sum, row) => sum + toMoney(row.amount) * 0.05, 0);

	const routeMap = new Map();
	for (const booking of topRouteBookings) {
		const origin = booking.trip?.route?.origin || "Unknown";
		const destination = booking.trip?.route?.destination || "Unknown";
		const key = `${origin} -> ${destination}`;
		routeMap.set(key, (routeMap.get(key) || 0) + 1);
	}

	const sortedRoutes = Array.from(routeMap.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.map(([route, bookings]) => ({ route, bookings }));

	return {
		generatedAt: new Date().toISOString(),
		stats: {
			totalUsers,
			activeSaccos,
			pendingSaccos,
			bookingsToday,
			grossRevenue,
			failedPaymentsToday,
			activeTrips,
			commission,
			openDisputes,
		},
		topRoutes: sortedRoutes,
		pendingActions: {
			saccoApprovals: pendingSaccos,
			fraudCases: openDisputes,
			openDisputes,
			pendingWithdrawals: await prisma.payment.count({ where: { status: "PENDING" } }),
		},
	};
}

export async function getAdminBookings(query = {}) {
	const q = String(query.q || "").trim();
	const status = String(query.status || "ALL").toUpperCase();
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};

	if (["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"].includes(status)) {
		where.status = status;
	}

	if (q) {
		where.OR = [
			{ bookingCode: { contains: q, mode: "insensitive" } },
			{ firstName: { contains: q, mode: "insensitive" } },
			{ lastName: { contains: q, mode: "insensitive" } },
			{ trip: { route: { origin: { contains: q, mode: "insensitive" } } } },
			{ trip: { route: { destination: { contains: q, mode: "insensitive" } } } },
			{ trip: { sacco: { name: { contains: q, mode: "insensitive" } } } },
		];
	}

	const bookings = await prisma.booking.findMany({
		where,
		include: {
			seat: true,
			payment: true,
			trip: {
				include: {
					route: true,
					sacco: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return bookings.map((booking) => ({
		id: booking.id,
		bookingCode: booking.bookingCode,
		passengerName: formatPassenger(booking),
		route: formatRoute(booking),
		saccoName: booking.trip?.sacco?.name || "-",
		createdAt: booking.createdAt,
		seatLabel: booking.seat ? `${booking.seat.seatNumber} ${booking.seat.seatClass}` : "-",
		amount: toMoney(booking.amount),
		paymentLabel:
			booking.payment?.status === "SUCCESS"
				? "M-Pesa ✓"
				: booking.payment?.status === "REFUNDED"
					? "Refunded"
					: booking.payment?.status === "FAILED"
						? "Pending"
						: "Pending",
		bookingStatus: booking.status,
		statusLabel: bookingStatusLabel(booking),
		paymentStatus: booking.payment?.status || null,
	}));
}

export async function getAdminPayments(query = {}) {
	const q = String(query.q || "").trim();
	const status = String(query.status || "ALL").toUpperCase();
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};

	if (["PENDING", "SUCCESS", "FAILED", "REFUNDED"].includes(status)) {
		where.status = status;
	}

	if (q) {
		where.OR = [
			{ transactionRef: { contains: q, mode: "insensitive" } },
			{ booking: { bookingCode: { contains: q, mode: "insensitive" } } },
			{ booking: { firstName: { contains: q, mode: "insensitive" } } },
			{ booking: { lastName: { contains: q, mode: "insensitive" } } },
			{ booking: { trip: { sacco: { name: { contains: q, mode: "insensitive" } } } } },
		];
	}

	const payments = await prisma.payment.findMany({
		where,
		include: {
			booking: {
				include: {
					trip: {
						include: {
							sacco: true,
							route: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return payments.map((payment) => ({
		id: payment.id,
		bookingCode: payment.booking?.bookingCode || "-",
		passengerName: payment.booking ? formatPassenger(payment.booking) : "Unknown passenger",
		saccoName: payment.booking?.trip?.sacco?.name || "-",
		route: payment.booking ? formatRoute(payment.booking) : "-",
		createdAt: payment.createdAt,
		amount: toMoney(payment.amount),
		commission: payment.status === "SUCCESS" ? toMoney(payment.amount) * 0.05 : 0,
		transactionRef: payment.transactionRef || "-",
		status: payment.status,
		statusLabel: paymentStatusLabel(payment),
	}));
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export async function getAdminUsers(query = {}) {
	const q = String(query.q || "").trim();
	const role = String(query.role || "ALL").toUpperCase();
	const status = String(query.status || "ALL").toUpperCase();
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};
	if (["USER", "OWNER", "ADMIN"].includes(role)) {
		where.role = role;
	}
	if (["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
		where.status = status;
	}
	if (q) {
		where.OR = [
			{ firstName: { contains: q, mode: "insensitive" } },
			{ lastName: { contains: q, mode: "insensitive" } },
			{ email: { contains: q, mode: "insensitive" } },
			{ phone: { contains: q, mode: "insensitive" } },
		];
	}

	const users = await prisma.user.findMany({
		where,
		include: {
			bookings: true,
			payments: true,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return users.map((user) => {
		const totalBookings = user.bookings.length;
		const paid = user.payments.filter((p) => p.status === "SUCCESS").length;
		const failed = user.payments.filter((p) => p.status === "FAILED").length;
		const trustScore = clamp(Math.round(70 + paid * 3 - failed * 5), 40, 98);

		return {
			id: user.id,
			name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
			email: user.email,
			phone: user.phone || "-",
			role: user.role,
			status: user.status,
			trustScore,
			trips: totalBookings,
			createdAt: user.createdAt,
		};
	});
}

export async function getAdminSaccos(query = {}) {
	const status = String(query.status || "ALL").toUpperCase();
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};
	if (status === "ACTIVE") where.isActive = true;
	if (status === "PENDING") where.isActive = false;

	const saccos = await prisma.sacco.findMany({
		where,
		include: {
			ownerProfile: {
				include: { user: true },
			},
			buses: true,
			trips: {
				include: {
					bookings: {
						include: { payment: true },
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return saccos.map((sacco) => {
		const routes = new Set(sacco.trips.map((trip) => trip.routeId)).size;
		const vehicles = sacco.buses.length;
		let bookings = 0;
		let revenue = 0;

		for (const trip of sacco.trips) {
			for (const booking of trip.bookings) {
				bookings += 1;
				if (booking.payment?.status === "SUCCESS") {
					revenue += toMoney(booking.payment.amount);
				}
			}
		}

		const statusLabel = sacco.isActive ? "Active" : "Pending";

		return {
			id: sacco.id,
			name: sacco.name,
			owner: sacco.ownerProfile?.user
				? `${sacco.ownerProfile.user.firstName} ${sacco.ownerProfile.user.lastName}`.trim()
				: "-",
			email: sacco.supportEmail || sacco.ownerProfile?.user?.email || "-",
			routes,
			vehicles,
			bookings,
			revenue,
			status: statusLabel,
			joined: sacco.createdAt,
			rating: 4.2,
		};
	});
}

export async function createAdminSacco(payload) {
	const {
		ownerFirstName,
		ownerLastName,
		ownerEmail,
		ownerPhone,
		ownerPassword,
		name,
		categoryId,
		supportEmail,
		supportPhone,
		logoUrl,
		isActive = true,
	} = payload;

	const existingUser = await prisma.user.findFirst({
		where: {
			OR: [
				{ email: ownerEmail },
				...(ownerPhone ? [{ phone: ownerPhone }] : []),
			],
		},
	});

	if (existingUser) {
		throw new Error("Owner email or phone is already in use");
	}

	const category = await prisma.category.findUnique({ where: { id: categoryId } });
	if (!category) {
		throw new Error("Category not found");
	}

	const hashedPassword = await hashPassword(ownerPassword);
	const baseSlug = slugify(name, { lower: true, strict: true });
	let slug = baseSlug;
	let counter = 1;

	while (await prisma.sacco.findUnique({ where: { slug } })) {
		slug = `${baseSlug}-${counter++}`;
	}

	const result = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				firstName: ownerFirstName,
				lastName: ownerLastName,
				email: ownerEmail,
				phone: ownerPhone,
				password: hashedPassword,
				role: "OWNER",
				ownerProfile: {
					create: {},
				},
			},
			include: { ownerProfile: true },
		});

		const sacco = await tx.sacco.create({
			data: {
				ownerProfileId: user.ownerProfile.id,
				categoryId,
				name,
				slug,
				logoUrl,
				supportPhone,
				supportEmail,
				isActive: Boolean(isActive),
			},
		});

		return { user, sacco };
	});

	return result.sacco;
}

export async function getAdminAnalytics() {
	const now = new Date();
	const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

	const payments = await prisma.payment.findMany({
		where: {
			status: "SUCCESS",
			createdAt: { gte: startMonth },
		},
		include: {
			booking: {
				include: {
					trip: {
						include: { sacco: true, route: true },
					},
				},
			},
		},
	});

	const monthlyMap = new Map();
	const routeMap = new Map();
	const saccoMap = new Map();

	for (const payment of payments) {
		const monthKey = `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, "0")}`;
		const monthData = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 };
		monthData.revenue += toMoney(payment.amount);
		monthData.bookings += 1;
		monthlyMap.set(monthKey, monthData);

		const route = payment.booking?.trip?.route;
		if (route) {
			const routeKey = `${route.origin} -> ${route.destination}`;
			const routeData = routeMap.get(routeKey) || { bookings: 0, revenue: 0 };
			routeData.bookings += 1;
			routeData.revenue += toMoney(payment.amount);
			routeMap.set(routeKey, routeData);
		}

		const sacco = payment.booking?.trip?.sacco;
		if (sacco) {
			const saccoData = saccoMap.get(sacco.name) || { revenue: 0, bookings: 0 };
			saccoData.revenue += toMoney(payment.amount);
			saccoData.bookings += 1;
			saccoMap.set(sacco.name, saccoData);
		}
	}

	const months = [];
	for (let i = 5; i >= 0; i -= 1) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const label = date.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
		const data = monthlyMap.get(key) || { revenue: 0, bookings: 0 };
		months.push({
			month: label,
			revenue: Number((data.revenue / 1_000_000).toFixed(2)),
			bookings: data.bookings,
		});
	}

	const topRoutes = Array.from(routeMap.entries())
		.map(([route, data]) => ({ route, bookings: data.bookings, revenue: data.revenue }))
		.sort((a, b) => b.bookings - a.bookings)
		.slice(0, 6);

	const topSaccos = Array.from(saccoMap.entries())
		.map(([name, data]) => ({ name, revenue: data.revenue, bookings: data.bookings }))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 6);

	return {
		months,
		topRoutes,
		topSaccos,
	};
}

export async function getAdminSupportTickets() {
	return supportTickets;
}

export async function getAdminSettings() {
	return adminSettings;
}

export async function updateAdminSettings(payload) {
	adminSettings = {
		...adminSettings,
		...payload,
		notifications: {
			...adminSettings.notifications,
			...(payload.notifications || {}),
		},
		platformInfo: adminSettings.platformInfo,
	};

	return adminSettings;
}

export async function updateSupportTicketStatus(ticketId, status) {
	const idx = supportTickets.findIndex((t) => t.id === ticketId);
	if (idx === -1) {
		throw new Error("Support ticket not found");
	}

	supportTickets[idx] = {
		...supportTickets[idx],
		status,
	};

	return supportTickets[idx];
}

export async function setSaccoActiveState(saccoId, isActive) {
	const sacco = await prisma.sacco.findUnique({ where: { id: saccoId } });
	if (!sacco) {
		throw new Error("Sacco not found");
	}

	return prisma.sacco.update({
		where: { id: saccoId },
		data: { isActive: Boolean(isActive) },
	});
}

export async function setUserStatus(userId, status) {
	const valid = ["ACTIVE", "INACTIVE", "SUSPENDED"];
	if (!valid.includes(status)) {
		throw new Error("Invalid user status");
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new Error("User not found");
	}

	return prisma.user.update({
		where: { id: userId },
		data: { status },
	});
}

let adminSettings = {
	commissionRate: 5,
	minimumFare: 50,
	aiPricing: true,
	fraudBlockThreshold: 80,
	delayRiskAlert: "medium",
	voiceLanguages: "en-sw",
	notifications: {
		smsBooking: true,
		emailTicket: true,
		pushDeparture: true,
		saccoRevenueReport: false,
		adminFraudAlert: true,
	},
	sessionTimeoutMinutes: 60,
	maxFailedLogins: 5,
	require2fa: true,
	platformInfo: {
		version: "3.0.0",
		environment: "Production",
		build: "20260319",
		apiStatus: "Operational",
	},
};

let supportTickets = [
	{
		id: "TKT-001",
		subject: "Did not receive ticket after payment",
		user: "Virginia Wamaitha",
		category: "Booking",
		created: "18 Mar 2026 09:12",
		priority: "High",
		status: "Open",
		assignedTo: "Sarah K.",
	},
	{
		id: "TKT-002",
		subject: "Driver refused to honour booking",
		user: "James Kariuki",
		category: "Dispute",
		created: "18 Mar 2026 08:45",
		priority: "High",
		status: "In Review",
		assignedTo: "John M.",
	},
	{
		id: "TKT-003",
		subject: "Overcharged for luggage — no receipt given",
		user: "Faith Njeri",
		category: "Payment",
		created: "17 Mar 2026 17:30",
		priority: "Medium",
		status: "In Review",
		assignedTo: "Sarah K.",
	},
	{
		id: "TKT-004",
		subject: "Cannot cancel booking — 24h before trip",
		user: "Brian Kimani",
		category: "Booking",
		created: "15 Mar 2026 14:00",
		priority: "Medium",
		status: "Resolved",
		assignedTo: "John M.",
	},
	{
		id: "TKT-005",
		subject: "M-Pesa deducted but no confirmation SMS",
		user: "Lucy Wanjiru",
		category: "Payment",
		created: "15 Mar 2026 11:20",
		priority: "High",
		status: "Open",
		assignedTo: "Unassigned",
	},
	{
		id: "TKT-006",
		subject: "Wrong seat allocated on bus",
		user: "Peter Odhiambo",
		category: "Booking",
		created: "14 Mar 2026 09:00",
		priority: "Low",
		status: "Resolved",
		assignedTo: "Sarah K.",
	},
	{
		id: "TKT-007",
		subject: "App shows wrong departure time for NBI-MBA",
		user: "Kevin Otieno",
		category: "App Bug",
		created: "14 Mar 2026 08:10",
		priority: "Medium",
		status: "In Review",
		assignedTo: "Dev Team",
	},
	{
		id: "TKT-008",
		subject: "SACCO blocked me without reason",
		user: "Samuel Mutua",
		category: "Dispute",
		created: "13 Mar 2026 16:55",
		priority: "High",
		status: "Escalated",
		assignedTo: "Admin",
	},
];
