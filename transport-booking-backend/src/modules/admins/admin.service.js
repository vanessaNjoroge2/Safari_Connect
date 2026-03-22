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

function normalizeAnalyticsRange(range) {
	const value = String(range || "6m").toLowerCase();
	if (["30d", "ytd", "6m"].includes(value)) return value;
	return "6m";
}

function resolveRangeWindow(now, range) {
	if (range === "30d") {
		const start = new Date(now);
		start.setDate(start.getDate() - 29);
		start.setHours(0, 0, 0, 0);
		return { start, mode: "daily" };
	}

	if (range === "ytd") {
		return {
			start: new Date(now.getFullYear(), 0, 1),
			mode: "monthly",
		};
	}

	return {
		start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
		mode: "monthly",
	};
}

function createTimeBuckets(now, range, mode) {
	const buckets = [];

	if (mode === "daily") {
		for (let i = 29; i >= 0; i -= 1) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);
			const key = date.toISOString().slice(0, 10);
			const label = date.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
			buckets.push({ key, label });
		}
		return buckets;
	}

	if (range === "ytd") {
		for (let m = 0; m <= now.getMonth(); m += 1) {
			const date = new Date(now.getFullYear(), m, 1);
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			const label = date.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
			buckets.push({ key, label });
		}
		return buckets;
	}

	for (let i = 5; i >= 0; i -= 1) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const label = date.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
		buckets.push({ key, label });
	}

	return buckets;
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

export async function getAdminAnalytics(query = {}) {
	const now = new Date();
	const range = normalizeAnalyticsRange(query.range);
	const { start: startWindow, mode } = resolveRangeWindow(now, range);
	const buckets = createTimeBuckets(now, range, mode);

	const payments = await prisma.payment.findMany({
		where: {
			status: "SUCCESS",
			createdAt: { gte: startWindow },
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
	const paidPerUser = new Map();
	const activeSaccoIds = new Set();
	let grossRevenue = 0;
	let totalBookings = 0;

	for (const payment of payments) {
		const monthKey =
			mode === "daily"
				? payment.createdAt.toISOString().slice(0, 10)
				: `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, "0")}`;
		const monthData = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 };
		monthData.revenue += toMoney(payment.amount);
		monthData.bookings += 1;
		monthlyMap.set(monthKey, monthData);
		grossRevenue += toMoney(payment.amount);
		totalBookings += 1;

		if (payment.userId) {
			paidPerUser.set(payment.userId, (paidPerUser.get(payment.userId) || 0) + 1);
		}

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
			activeSaccoIds.add(sacco.id);
			const saccoData = saccoMap.get(sacco.name) || { revenue: 0, bookings: 0 };
			saccoData.revenue += toMoney(payment.amount);
			saccoData.bookings += 1;
			saccoMap.set(sacco.name, saccoData);
		}
	}

	const months = [];
	for (const bucket of buckets) {
		const key = bucket.key;
		const label = bucket.label;
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

	const [refundedPayments, processedPayments, newUsers] = await Promise.all([
		prisma.payment.count({
			where: {
				status: "REFUNDED",
				createdAt: { gte: startWindow },
			},
		}),
		prisma.payment.count({
			where: {
				status: { in: ["SUCCESS", "FAILED", "REFUNDED"] },
				createdAt: { gte: startWindow },
			},
		}),
		prisma.user.count({
			where: {
				createdAt: { gte: startWindow },
			},
		}),
	]);

	const repeatCustomers = Array.from(paidPerUser.values()).filter((count) => count >= 2).length;
	const repeatBookingRate = paidPerUser.size ? Number(((repeatCustomers / paidPerUser.size) * 100).toFixed(1)) : 0;
	const refundRate = processedPayments ? Number(((refundedPayments / processedPayments) * 100).toFixed(1)) : 0;
	const platformCommission = Number((grossRevenue * 0.05).toFixed(2));
	const avgFare = totalBookings ? Number((grossRevenue / totalBookings).toFixed(2)) : 0;
	const periodLabel = range === "30d" ? "Last 30 days" : range === "ytd" ? `YTD ${now.getFullYear()}` : "Last 6 months";

	return {
		range,
		periodLabel,
		generatedAt: now.toISOString(),
		windowStart: startWindow.toISOString(),
		windowEnd: now.toISOString(),
		kpis: {
			grossRevenue,
			totalBookings,
			activeSaccos: activeSaccoIds.size,
			platformCommission,
			avgFare,
			refundRate,
			newUsers,
			repeatBookingRate,
		},
		months,
		topRoutes,
		topSaccos,
	};
}

const VALID_SUPPORT_STATUS = ["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED"];
const VALID_SUPPORT_PRIORITY = ["LOW", "MEDIUM", "HIGH"];
const VALID_SUPPORT_CATEGORY = ["BOOKING", "PAYMENT", "DISPUTE", "APP_BUG", "GENERAL"];
const VALID_NOTIFICATION_CHANNEL = ["IN_APP", "EMAIL", "SMS", "PUSH"];
const VALID_NOTIFICATION_STATUS = ["DRAFT", "SCHEDULED", "SENT", "CANCELLED"];
const VALID_NOTIFICATION_TARGET = ["ADMIN", "OWNER", "USER", "ALL"];
const VALID_HELP_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function toUiSupportStatus(status) {
	if (status === "IN_REVIEW") return "In Review";
	const lower = String(status || "").toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toUiSupportCategory(category) {
	if (category === "APP_BUG") return "App Bug";
	const lower = String(category || "").toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toUiNotificationChannel(channel) {
	if (channel === "IN_APP") return "In App";
	const lower = String(channel || "").toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toUiNotificationStatus(status) {
	const lower = String(status || "").toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function parseSupportStatus(status) {
	if (!status) return undefined;
	const normalized = String(status).trim().toUpperCase().replace(/\s+/g, "_");
	if (!VALID_SUPPORT_STATUS.includes(normalized)) throw new Error("Invalid support ticket status");
	return normalized;
}

function parseSupportPriority(priority) {
	if (!priority) return undefined;
	const normalized = String(priority).trim().toUpperCase();
	if (!VALID_SUPPORT_PRIORITY.includes(normalized)) throw new Error("Invalid support ticket priority");
	return normalized;
}

function parseSupportCategory(category) {
	if (!category) return undefined;
	const normalized = String(category).trim().toUpperCase().replace(/\s+/g, "_");
	if (!VALID_SUPPORT_CATEGORY.includes(normalized)) throw new Error("Invalid support ticket category");
	return normalized;
}

function parseNotificationChannel(channel) {
	if (!channel) throw new Error("Notification channel is required");
	const normalized = String(channel).trim().toUpperCase().replace(/\s+/g, "_");
	if (!VALID_NOTIFICATION_CHANNEL.includes(normalized)) throw new Error("Invalid notification channel");
	return normalized;
}

function parseNotificationTarget(targetRole) {
	if (!targetRole) return "ALL";
	const normalized = String(targetRole).trim().toUpperCase();
	if (!VALID_NOTIFICATION_TARGET.includes(normalized)) throw new Error("Invalid notification target role");
	return normalized;
}

function parseNotificationStatus(status) {
	if (!status) return undefined;
	const normalized = String(status).trim().toUpperCase();
	if (!VALID_NOTIFICATION_STATUS.includes(normalized)) throw new Error("Invalid notification status");
	return normalized;
}

function parseHelpStatus(status) {
	if (!status) return undefined;
	const normalized = String(status).trim().toUpperCase();
	if (!VALID_HELP_STATUS.includes(normalized)) throw new Error("Invalid help article status");
	return normalized;
}

function toHelpSlug(title) {
	return slugify(String(title || ""), { lower: true, strict: true });
}

function mapTicket(ticket) {
	return {
		id: ticket.id,
		ticketCode: ticket.ticketCode,
		subject: ticket.subject,
		user: ticket.userName,
		category: toUiSupportCategory(ticket.category),
		created: ticket.createdAt.toLocaleString("en-KE", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}),
		priority: ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase(),
		status: toUiSupportStatus(ticket.status),
		assignedTo: ticket.assignedTo || "Unassigned",
		description: ticket.description || "",
	};
}

function mapSettings(settings) {
	return {
		commissionRate: settings.commissionRate,
		minimumFare: settings.minimumFare,
		aiPricing: settings.aiPricing,
		fraudBlockThreshold: settings.fraudBlockThreshold,
		delayRiskAlert: settings.delayRiskAlert,
		voiceLanguages: settings.voiceLanguages,
		notifications: {
			smsBooking: settings.smsBooking,
			emailTicket: settings.emailTicket,
			pushDeparture: settings.pushDeparture,
			pushNotifications: settings.pushNotifications,
			saccoRevenueReport: settings.saccoRevenueReport,
			adminFraudAlert: settings.adminFraudAlert,
		},
		sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
		maxFailedLogins: settings.maxFailedLogins,
		require2fa: settings.require2fa,
		platformInfo: {
			version: settings.version,
			environment: settings.environment,
			build: settings.build,
			apiStatus: settings.apiStatus,
		},
	};
}

async function ensurePlatformSettings() {
	const settings = await prisma.platformSetting.findUnique({ where: { id: "default" } });
	if (settings) return settings;

	return prisma.platformSetting.create({
		data: {
			id: "default",
		},
	});
}

async function ensureSupportSeed() {
	const count = await prisma.supportTicket.count();
	if (count > 0) return;

	await prisma.supportTicket.createMany({
		data: [
			{
				ticketCode: "TKT-001",
				subject: "Did not receive ticket after payment",
				userName: "Virginia Wamaitha",
				category: "BOOKING",
				priority: "HIGH",
				status: "OPEN",
				assignedTo: "Sarah K.",
				description: "Passenger completed payment but did not receive digital ticket in app.",
			},
			{
				ticketCode: "TKT-002",
				subject: "Driver refused to honour booking",
				userName: "James Kariuki",
				category: "DISPUTE",
				priority: "HIGH",
				status: "IN_REVIEW",
				assignedTo: "John M.",
				description: "Passenger flagged refusal to board despite valid booking code.",
			},
			{
				ticketCode: "TKT-003",
				subject: "Overcharged for luggage with no receipt",
				userName: "Faith Njeri",
				category: "PAYMENT",
				priority: "MEDIUM",
				status: "IN_REVIEW",
				assignedTo: "Sarah K.",
				description: "Possible extra charge by conductor not reflected in booking record.",
			},
		],
	});
}

async function ensureNotificationSeed() {
	const count = await prisma.adminNotification.count();
	if (count > 0) return;

	await prisma.adminNotification.createMany({
		data: [
			{
				title: "Weekend surge pricing advisory",
				message: "Expected demand spike on Nairobi routes this weekend. Monitor fare bands.",
				channel: "IN_APP",
				targetRole: "OWNER",
				status: "SENT",
				sentAt: new Date(),
			},
			{
				title: "Fraud risk bulletin",
				message: "Escalated failed payment retries detected. Review flagged bookings.",
				channel: "EMAIL",
				targetRole: "ADMIN",
				status: "DRAFT",
			},
		],
	});
}

async function ensureHelpSeed() {
	const count = await prisma.helpArticle.count();
	if (count > 0) return;

	await prisma.helpArticle.createMany({
		data: [
			{
				title: "How to resolve payment disputes",
				slug: "how-to-resolve-payment-disputes",
				category: "Support",
				content: "Verify payment reference, reconcile booking and payment records, then communicate a resolution timeline.",
				status: "PUBLISHED",
				isAiGenerated: false,
			},
			{
				title: "Escalation workflow for unresolved tickets",
				slug: "escalation-workflow-for-unresolved-tickets",
				category: "Operations",
				content: "Move unresolved high-priority tickets to escalated status and assign accountability owner immediately.",
				status: "PUBLISHED",
				isAiGenerated: false,
			},
		],
	});
}

export async function getAdminSupportTickets(query = {}) {
	await ensureSupportSeed();

	const q = String(query.q || "").trim();
	const status = parseSupportStatus(query.status);
	const category = parseSupportCategory(query.category);
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};
	if (status) where.status = status;
	if (category) where.category = category;
	if (q) {
		where.OR = [
			{ ticketCode: { contains: q, mode: "insensitive" } },
			{ subject: { contains: q, mode: "insensitive" } },
			{ userName: { contains: q, mode: "insensitive" } },
			{ assignedTo: { contains: q, mode: "insensitive" } },
		];
	}

	const tickets = await prisma.supportTicket.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return tickets.map(mapTicket);
}

export async function createAdminSupportTicket(payload = {}) {
	await ensureSupportSeed();

	const subject = String(payload.subject || "").trim();
	const user = String(payload.user || "").trim();
	if (!subject || !user) throw new Error("Subject and user are required");

	const total = await prisma.supportTicket.count();
	const ticketCode = `TKT-${String(total + 1).padStart(3, "0")}`;

	const created = await prisma.supportTicket.create({
		data: {
			ticketCode,
			subject,
			userName: user,
			category: parseSupportCategory(payload.category) || "GENERAL",
			priority: parseSupportPriority(payload.priority) || "MEDIUM",
			status: parseSupportStatus(payload.status) || "OPEN",
			assignedTo: String(payload.assignedTo || "").trim() || null,
			description: String(payload.description || "").trim() || null,
		},
	});

	return mapTicket(created);
}

export async function updateSupportTicketStatus(ticketId, payload = {}) {
	const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
	if (!ticket) throw new Error("Support ticket not found");

	const data = {};
	const status = parseSupportStatus(payload.status);
	const priority = parseSupportPriority(payload.priority);
	const category = parseSupportCategory(payload.category);

	if (status) data.status = status;
	if (priority) data.priority = priority;
	if (category) data.category = category;
	if (payload.subject !== undefined) data.subject = String(payload.subject || "").trim() || ticket.subject;
	if (payload.user !== undefined) data.userName = String(payload.user || "").trim() || ticket.userName;
	if (payload.assignedTo !== undefined) {
		const assigned = String(payload.assignedTo || "").trim();
		data.assignedTo = assigned || null;
	}
	if (payload.description !== undefined) {
		const description = String(payload.description || "").trim();
		data.description = description || null;
	}

	const updated = await prisma.supportTicket.update({
		where: { id: ticketId },
		data,
	});

	return mapTicket(updated);
}

export async function deleteSupportTicket(ticketId) {
	const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
	if (!ticket) throw new Error("Support ticket not found");

	await prisma.supportTicket.delete({ where: { id: ticketId } });
	return { id: ticketId };
}

export async function getAdminSettings() {
	const settings = await ensurePlatformSettings();
	return mapSettings(settings);
}

export async function updateAdminSettings(payload) {
	const current = await ensurePlatformSettings();

	const nextNotifications = {
		smsBooking: payload.notifications?.smsBooking ?? current.smsBooking,
		emailTicket: payload.notifications?.emailTicket ?? current.emailTicket,
		pushDeparture: payload.notifications?.pushDeparture ?? current.pushDeparture,
		pushNotifications: payload.notifications?.pushNotifications ?? current.pushNotifications,
		saccoRevenueReport: payload.notifications?.saccoRevenueReport ?? current.saccoRevenueReport,
		adminFraudAlert: payload.notifications?.adminFraudAlert ?? current.adminFraudAlert,
	};

	const updated = await prisma.platformSetting.update({
		where: { id: "default" },
		data: {
			commissionRate: payload.commissionRate ?? current.commissionRate,
			minimumFare: payload.minimumFare ?? current.minimumFare,
			aiPricing: payload.aiPricing ?? current.aiPricing,
			fraudBlockThreshold: payload.fraudBlockThreshold ?? current.fraudBlockThreshold,
			delayRiskAlert: payload.delayRiskAlert ?? current.delayRiskAlert,
			voiceLanguages: payload.voiceLanguages ?? current.voiceLanguages,
			smsBooking: nextNotifications.smsBooking,
			emailTicket: nextNotifications.emailTicket,
			pushDeparture: nextNotifications.pushDeparture,
			pushNotifications: nextNotifications.pushNotifications,
			saccoRevenueReport: nextNotifications.saccoRevenueReport,
			adminFraudAlert: nextNotifications.adminFraudAlert,
			sessionTimeoutMinutes: payload.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
			maxFailedLogins: payload.maxFailedLogins ?? current.maxFailedLogins,
			require2fa: payload.require2fa ?? current.require2fa,
			version: payload.platformInfo?.version ?? current.version,
			environment: payload.platformInfo?.environment ?? current.environment,
			build: payload.platformInfo?.build ?? current.build,
			apiStatus: payload.platformInfo?.apiStatus ?? current.apiStatus,
		},
	});

	return mapSettings(updated);
}

export async function getAdminNotifications(query = {}) {
	await ensureNotificationSeed();

	const q = String(query.q || "").trim();
	const status = parseNotificationStatus(query.status);
	const channel = query.channel ? parseNotificationChannel(query.channel) : undefined;
	const targetRole = query.targetRole ? parseNotificationTarget(query.targetRole) : undefined;
	const limit = Math.min(Math.max(Number(query.limit || 200), 1), 500);

	const where = {};
	if (status) where.status = status;
	if (channel) where.channel = channel;
	if (targetRole) where.targetRole = targetRole;
	if (q) {
		where.OR = [
			{ title: { contains: q, mode: "insensitive" } },
			{ message: { contains: q, mode: "insensitive" } },
		];
	}

	const rows = await prisma.adminNotification.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		message: row.message,
		channel: toUiNotificationChannel(row.channel),
		targetRole: row.targetRole,
		status: toUiNotificationStatus(row.status),
		scheduledFor: row.scheduledFor,
		sentAt: row.sentAt,
		createdAt: row.createdAt,
	}));
}

export async function createAdminNotification(payload = {}) {
	await ensureNotificationSeed();
	const title = String(payload.title || "").trim();
	const message = String(payload.message || "").trim();
	if (!title || !message) throw new Error("Title and message are required");

	const status = parseNotificationStatus(payload.status) || "DRAFT";
	const scheduledFor = payload.scheduledFor ? new Date(payload.scheduledFor) : null;

	const row = await prisma.adminNotification.create({
		data: {
			title,
			message,
			channel: parseNotificationChannel(payload.channel),
			targetRole: parseNotificationTarget(payload.targetRole),
			status,
			scheduledFor,
			sentAt: status === "SENT" ? new Date() : null,
		},
	});

	return {
		id: row.id,
		title: row.title,
		message: row.message,
		channel: toUiNotificationChannel(row.channel),
		targetRole: row.targetRole,
		status: toUiNotificationStatus(row.status),
		scheduledFor: row.scheduledFor,
		sentAt: row.sentAt,
		createdAt: row.createdAt,
	};
}

export async function updateAdminNotification(notificationId, payload = {}) {
	const existing = await prisma.adminNotification.findUnique({ where: { id: notificationId } });
	if (!existing) throw new Error("Notification not found");

	const status = parseNotificationStatus(payload.status);
	const data = {};
	if (payload.title !== undefined) data.title = String(payload.title || "").trim() || existing.title;
	if (payload.message !== undefined) data.message = String(payload.message || "").trim() || existing.message;
	if (payload.channel !== undefined) data.channel = parseNotificationChannel(payload.channel);
	if (payload.targetRole !== undefined) data.targetRole = parseNotificationTarget(payload.targetRole);
	if (status) {
		data.status = status;
		if (status === "SENT") data.sentAt = new Date();
	}
	if (payload.scheduledFor !== undefined) {
		data.scheduledFor = payload.scheduledFor ? new Date(payload.scheduledFor) : null;
	}

	const row = await prisma.adminNotification.update({
		where: { id: notificationId },
		data,
	});

	return {
		id: row.id,
		title: row.title,
		message: row.message,
		channel: toUiNotificationChannel(row.channel),
		targetRole: row.targetRole,
		status: toUiNotificationStatus(row.status),
		scheduledFor: row.scheduledFor,
		sentAt: row.sentAt,
		createdAt: row.createdAt,
	};
}

export async function deleteAdminNotification(notificationId) {
	const existing = await prisma.adminNotification.findUnique({ where: { id: notificationId } });
	if (!existing) throw new Error("Notification not found");

	await prisma.adminNotification.delete({ where: { id: notificationId } });
	return { id: notificationId };
}

export async function getAdminHelpArticles(query = {}) {
	await ensureHelpSeed();

	const q = String(query.q || "").trim();
	const status = parseHelpStatus(query.status);
	const limit = Math.min(Math.max(Number(query.limit || 100), 1), 200);

	const where = {};
	if (status) where.status = status;
	if (q) {
		where.OR = [
			{ title: { contains: q, mode: "insensitive" } },
			{ category: { contains: q, mode: "insensitive" } },
			{ content: { contains: q, mode: "insensitive" } },
		];
	}

	return prisma.helpArticle.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		take: limit,
	});
}

export async function createAdminHelpArticle(payload = {}) {
	const title = String(payload.title || "").trim();
	const category = String(payload.category || "").trim();
	const content = String(payload.content || "").trim();
	if (!title || !category || !content) throw new Error("Title, category and content are required");

	const baseSlug = toHelpSlug(title);
	let slug = baseSlug;
	let i = 1;
	while (await prisma.helpArticle.findUnique({ where: { slug } })) {
		slug = `${baseSlug}-${i++}`;
	}

	return prisma.helpArticle.create({
		data: {
			title,
			slug,
			category,
			content,
			status: parseHelpStatus(payload.status) || "PUBLISHED",
			isAiGenerated: Boolean(payload.isAiGenerated),
		},
	});
}

export async function updateAdminHelpArticle(helpId, payload = {}) {
	const existing = await prisma.helpArticle.findUnique({ where: { id: helpId } });
	if (!existing) throw new Error("Help article not found");

	let slug = existing.slug;
	if (payload.title !== undefined) {
		const nextTitle = String(payload.title || "").trim();
		if (nextTitle) {
			const baseSlug = toHelpSlug(nextTitle);
			slug = baseSlug;
			let i = 1;
			while (true) {
				const found = await prisma.helpArticle.findUnique({ where: { slug } });
				if (!found || found.id === existing.id) break;
				slug = `${baseSlug}-${i++}`;
			}
		}
	}

	return prisma.helpArticle.update({
		where: { id: helpId },
		data: {
			title: payload.title !== undefined ? String(payload.title || "").trim() || existing.title : existing.title,
			slug,
			category: payload.category !== undefined ? String(payload.category || "").trim() || existing.category : existing.category,
			content: payload.content !== undefined ? String(payload.content || "").trim() || existing.content : existing.content,
			status: parseHelpStatus(payload.status) || existing.status,
			isAiGenerated: payload.isAiGenerated !== undefined ? Boolean(payload.isAiGenerated) : existing.isAiGenerated,
		},
	});
}

export async function deleteAdminHelpArticle(helpId) {
	const existing = await prisma.helpArticle.findUnique({ where: { id: helpId } });
	if (!existing) throw new Error("Help article not found");

	await prisma.helpArticle.delete({ where: { id: helpId } });
	return { id: helpId };
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
