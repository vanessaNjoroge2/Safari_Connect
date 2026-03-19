import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

function normalizeBaseUrl(url) {
  return String(url || "http://localhost:4100").replace(/\/+$/, "");
}

function buildUpstreamError(status, fallbackMessage) {
  const error = new Error(fallbackMessage);
  error.statusCode = status;
  return error;
}

async function callAi(path, payload, method = "POST") {
  const baseUrl = normalizeBaseUrl(env.AI_AGENT_BASE_URL);
  const timeoutMs = Number(env.AI_AGENT_TIMEOUT_MS || 8000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: method === "GET" ? undefined : JSON.stringify(payload || {}),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || data?.error || `AI agent request failed (${response.status})`;
      throw buildUpstreamError(502, message);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw buildUpstreamError(504, "AI agent timeout");
    }

    if (error.statusCode) {
      throw error;
    }

    throw buildUpstreamError(502, "Could not reach AI agent service");
  } finally {
    clearTimeout(timer);
  }
}

function fallbackHealth() {
  return {
    status: "degraded",
    service: "safari-connect-ai-agent-proxy",
    reason: "upstream_unavailable",
    languageSupport: ["en", "sw"],
    geminiConfigured: false,
    fallback: true,
  };
}

function fallbackChat(payload = {}) {
  const text = String(payload?.text || "").toLowerCase();
  const isSw = String(payload?.language || "en").toLowerCase().startsWith("sw");

  const sw = {
    base: "Niko tayari kusaidia. Nipatie route, tarehe/saa na bajeti ili nikupatie chaguo bora.",
    pricing: "Ninaweza kukupa muda wa nauli nafuu. Nipatie route na muda wa kuondoka.",
    delay: "Naweza kukadiria hatari ya ucheleweshaji kwa kutumia traffic, weather na route risk.",
    fraud: "Muamala huu una alama zisizo za kawaida. Ushauri: weka kwenye review kabla ya kuthibitisha.",
  };

  const en = {
    base: "I can help. Share route, date/time, and budget so I can suggest the best option.",
    pricing: "I can suggest a cheaper fare window. Share route and departure time.",
    delay: "I can estimate delay risk from route, weather, and traffic inputs.",
    fraud: "This transaction shows unusual signals. Recommendation: place it in review before confirmation.",
  };

  const hints = isSw ? sw : en;
  let message = hints.base;
  if (text.includes("price") || text.includes("fare") || text.includes("bei")) message = hints.pricing;
  if (text.includes("delay") || text.includes("traffic") || text.includes("uchelew")) message = hints.delay;
  if (text.includes("fraud") || text.includes("anomaly") || text.includes("suspicious")) message = hints.fraud;

  return {
    intent: "decision_guidance",
    message,
    source: "fallback",
    modelUsed: null,
    disclaimer: "Generated from deterministic fallback because upstream AI was unavailable.",
  };
}

function fallbackVoice(payload = {}) {
  const isSw = String(payload?.language || "en").toLowerCase().startsWith("sw");
  return {
    language: isSw ? "sw" : "en",
    provider: "browser",
    transcript: String(payload?.transcript || ""),
    replyText: isSw
      ? "Niko tayari kusaidia. Nipatie route, tarehe na bajeti ili nikupatie uamuzi bora."
      : "I am ready to help. Share route, date, and budget for a better decision.",
    source: "fallback",
    modelUsed: null,
    disclaimer: "Voice response generated from deterministic fallback because upstream AI was unavailable.",
    inputMode: "voice",
    outputMode: "text-and-tts",
    ttsVoice: isSw ? "sw-KE-Standard-A" : "en-KE-Neural2-A",
    ttsProvider: "browser",
    audioBase64: null,
    audioMimeType: null,
    note: "Premium TTS unavailable. Frontend may use browser speech synthesis.",
  };
}

function fallbackAssist(payload = {}) {
  const currentPrice = Number(payload?.currentPrice || 1500);
  const bookedSeats = Number(payload?.bookedSeats || 0);
  const totalSeats = Number(payload?.totalSeats || 50);
  const occupancyRate = totalSeats > 0 ? Math.min(1, Math.max(0, bookedSeats / totalSeats)) : 0;
  const predictedPrice = Number((currentPrice * (occupancyRate > 0.75 ? 1.15 : 0.95)).toFixed(2));
  const fraudScore = 0.52;
  const fraudDecision = fraudScore >= 0.7 ? "block" : fraudScore >= 0.45 ? "review" : "allow";
  const delayRisk = Math.min(0.92, Math.max(0.15, Number(payload?.riskFactors?.trafficRisk || 0.4) * 0.6 + Number(payload?.riskFactors?.weatherRisk || 0.3) * 0.4));
  const riskLevel = delayRisk >= 0.65 ? "high" : delayRisk >= 0.4 ? "medium" : "low";
  const action = occupancyRate >= 0.9 ? "add_vehicle" : occupancyRate >= 0.75 ? "enable_waitlist" : riskLevel === "high" ? "shift_departure" : "hold";

  return {
    language: String(payload?.language || "en").toLowerCase().startsWith("sw") ? "sw" : "en",
    modules: {
      recommendation: {
        topPick: payload?.trips?.[0] || null,
        confidence: 0.63,
        ranked: Array.isArray(payload?.trips) ? payload.trips : [],
        rationale: "Fallback ranking based on provided trip order.",
        signalsUsed: ["price", "travelMinutes", "reliabilityScore"],
      },
      pricing: {
        route: payload?.route || null,
        currentPrice,
        predictedPrice,
        confidence: 0.61,
        demandLevel: occupancyRate > 0.75 ? "high" : "normal",
        cheaperWindowSuggestion: occupancyRate > 0.75 ? "10:00-16:00" : "Current slot is cost-efficient",
        signalsUsed: ["currentPrice", "bookedSeats", "totalSeats"],
      },
      delayRisk: {
        riskScore: Number(delayRisk.toFixed(4)),
        riskLevel,
        confidence: 0.64,
        recommendation:
          riskLevel === "high"
            ? "Adjust departure by 15-30 minutes and notify passengers."
            : "Risk acceptable; continue monitoring traffic and weather updates.",
        signalsUsed: ["weatherRisk", "trafficRisk", "routeRisk"],
      },
      fraud: {
        fraudScore,
        decision: fraudDecision,
        confidence: 0.6,
        reason: "Fallback risk signal due to upstream AI unavailability.",
        signalsUsed: ["attemptsLast24h", "cardMismatch", "rapidRetries", "geoMismatch"],
      },
      operations: {
        route: payload?.route || null,
        occupancyRate: Number(occupancyRate.toFixed(2)),
        riskLevel,
        combinedRisk: Number(delayRisk.toFixed(2)),
        overbookingBuffer: Math.max(0, Math.min(6, Math.round(bookedSeats * Number(payload?.noShowRate || 0.08)))),
        action,
        dispatchAdvice:
          action === "add_vehicle"
            ? "High demand detected. Add standby vehicle to avoid spillover."
            : action === "enable_waitlist"
              ? "Enable waitlist and pre-confirm demand-heavy passengers."
              : action === "shift_departure"
                ? "Operational risk elevated. Shift departure and notify passengers."
                : "Maintain schedule and keep monitoring demand.",
        confidence: 0.62,
        signalsUsed: ["totalSeats", "bookedSeats", "noShowRate", "weatherRisk", "trafficRisk"],
      },
      chat: fallbackChat({ text: payload?.prompt || "", language: payload?.language || "en" }),
    },
    summary: {
      topAction: action,
      passengerMessage: "We are running in resilient fallback mode. Share route, time, and budget for a stronger recommendation.",
    },
    fallback: true,
  };
}

export const getAiHealth = async () => {
  try {
    return await callAi("/health", null, "GET");
  } catch {
    return fallbackHealth();
  }
};

export const getAiAssist = async (payload) => {
  try {
    return await callAi("/v1/decision/assist", payload);
  } catch {
    return fallbackAssist(payload);
  }
};

export const getAiChat = async (payload) => {
  try {
    return await callAi("/v1/chat/respond", payload);
  } catch {
    return fallbackChat(payload);
  }
};

export const getAiVoice = async (payload) => {
  try {
    return await callAi("/v1/voice/respond", payload);
  } catch {
    return fallbackVoice(payload);
  }
};

function dayKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round2(value) {
  return Number(safeNumber(value).toFixed(2));
}

async function buildOwnerContext(userId) {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: { sacco: true },
  });

  if (!ownerProfile?.sacco) {
    return {
      scope: "owner",
      source: "database",
      generatedAt: new Date().toISOString(),
      vehicles: [],
      routes: [],
      trips: [],
      pricing: { minFare: 0, maxFare: 0, avgFare: 0, currency: "KES" },
      operations: {
        totalVehicles: 0,
        activeVehicles: 0,
        totalRoutes: 0,
        totalUpcomingTrips: 0,
        overallOccupancyRate: 0,
      },
      analytics: {
        routePerformance: [],
        revenueTrend: [],
      },
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [buses, trips, revenueBookings] = await Promise.all([
    prisma.bus.findMany({
      where: { saccoId: ownerProfile.sacco.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trip.findMany({
      where: {
        saccoId: ownerProfile.sacco.id,
        status: "SCHEDULED",
      },
      include: {
        route: true,
        bus: true,
        bookings: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
      take: 120,
    }),
    prisma.booking.findMany({
      where: {
        trip: {
          saccoId: ownerProfile.sacco.id,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        createdAt: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        amount: true,
      },
    }),
  ]);

  const tripRows = trips.map((trip) => {
    const booked = trip.bookings.filter(
      (b) => b.status === "PENDING" || b.status === "CONFIRMED"
    ).length;
    const capacity = Math.max(1, trip.bus.seatCapacity);
    const occupancyRate = booked / capacity;
    return {
      id: trip.id,
      routeId: trip.routeId,
      route: `${trip.route.origin}-${trip.route.destination}`,
      origin: trip.route.origin,
      destination: trip.route.destination,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      vehicleName: trip.bus.name,
      plateNumber: trip.bus.plateNumber,
      seatCapacity: trip.bus.seatCapacity,
      bookedSeats: booked,
      availableSeats: Math.max(0, capacity - booked),
      occupancyRate,
      price: safeNumber(trip.basePrice),
      travelMinutes: Math.max(
        0,
        Math.round(
          (new Date(trip.arrivalTime).getTime() -
            new Date(trip.departureTime).getTime()) /
            (1000 * 60)
        )
      ),
      reliabilityScore: round2(Math.max(0.5, 1 - Math.min(0.5, occupancyRate * 0.35))),
    };
  });

  const routeStats = new Map();
  for (const trip of tripRows) {
    const key = trip.routeId;
    if (!routeStats.has(key)) {
      routeStats.set(key, {
        id: key,
        route: `${trip.origin} -> ${trip.destination}`,
        origin: trip.origin,
        destination: trip.destination,
        fares: [],
        occupancies: [],
        passengerCount: 0,
        tripCount: 0,
      });
    }
    const stat = routeStats.get(key);
    stat.fares.push(trip.price);
    stat.occupancies.push(trip.occupancyRate);
    stat.passengerCount += trip.bookedSeats;
    stat.tripCount += 1;
  }

  const routes = Array.from(routeStats.values())
    .map((s) => ({
      id: s.id,
      route: s.route,
      origin: s.origin,
      destination: s.destination,
      tripCount: s.tripCount,
      passengerCount: s.passengerCount,
      avgFare: round2(mean(s.fares)),
      avgOccupancyRate: round2(mean(s.occupancies)),
    }))
    .sort((a, b) => b.tripCount - a.tripCount);

  const prices = tripRows.map((t) => t.price);
  const occupancyValues = tripRows.map((t) => t.occupancyRate);

  const revenueByDay = new Map();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    revenueByDay.set(dayKey(d), 0);
  }
  for (const booking of revenueBookings) {
    const key = dayKey(booking.createdAt);
    revenueByDay.set(key, safeNumber(revenueByDay.get(key)) + safeNumber(booking.amount));
  }

  const revenueTrend = Array.from(revenueByDay.entries()).map(([date, amount]) => {
    const d = new Date(date);
    return {
      date,
      day: d.toLocaleDateString("en-KE", { weekday: "short" }),
      amount: round2(amount),
    };
  });

  return {
    scope: "owner",
    source: "database",
    generatedAt: new Date().toISOString(),
    sacco: {
      id: ownerProfile.sacco.id,
      name: ownerProfile.sacco.name,
      categoryId: ownerProfile.sacco.categoryId,
    },
    vehicles: buses.map((bus) => ({
      id: bus.id,
      name: bus.name,
      plateNumber: bus.plateNumber,
      seatCapacity: bus.seatCapacity,
      isActive: bus.isActive,
    })),
    routes,
    trips: tripRows,
    pricing: {
      minFare: prices.length ? round2(Math.min(...prices)) : 0,
      maxFare: prices.length ? round2(Math.max(...prices)) : 0,
      avgFare: prices.length ? round2(mean(prices)) : 0,
      currency: "KES",
    },
    operations: {
      totalVehicles: buses.length,
      activeVehicles: buses.filter((b) => b.isActive).length,
      totalRoutes: routes.length,
      totalUpcomingTrips: tripRows.length,
      overallOccupancyRate: occupancyValues.length ? round2(mean(occupancyValues)) : 0,
    },
    analytics: {
      routePerformance: routes.slice(0, 6),
      revenueTrend,
    },
  };
}

async function buildPassengerContext(userId) {
  const now = new Date();
  const trips = await prisma.trip.findMany({
    where: { status: "SCHEDULED" },
    include: {
      route: true,
      bus: true,
      bookings: {
        select: {
          status: true,
        },
      },
      sacco: true,
    },
    orderBy: { departureTime: "asc" },
    take: 80,
  });

  const myBookings = userId
    ? await prisma.booking.findMany({
        where: { userId },
        include: {
          trip: {
            include: {
              route: true,
              sacco: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const tripRows = trips.map((trip) => {
    const booked = trip.bookings.filter(
      (b) => b.status === "PENDING" || b.status === "CONFIRMED"
    ).length;
    const capacity = Math.max(1, trip.bus.seatCapacity);
    return {
      id: trip.id,
      route: `${trip.route.origin}-${trip.route.destination}`,
      origin: trip.route.origin,
      destination: trip.route.destination,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      saccoName: trip.sacco.name,
      vehicleName: trip.bus.name,
      plateNumber: trip.bus.plateNumber,
      seatCapacity: trip.bus.seatCapacity,
      bookedSeats: booked,
      availableSeats: Math.max(0, capacity - booked),
      occupancyRate: booked / capacity,
      price: safeNumber(trip.basePrice),
      travelMinutes: Math.max(
        0,
        Math.round(
          (new Date(trip.arrivalTime).getTime() -
            new Date(trip.departureTime).getTime()) /
            (1000 * 60)
        )
      ),
      reliabilityScore: round2(Math.max(0.5, 1 - Math.min(0.45, (booked / capacity) * 0.35))),
    };
  });

  const prices = tripRows.map((t) => t.price);
  const routes = new Map();
  for (const trip of tripRows) {
    const key = `${trip.origin}->${trip.destination}`;
    if (!routes.has(key)) {
      routes.set(key, {
        id: key,
        route: `${trip.origin} -> ${trip.destination}`,
        origin: trip.origin,
        destination: trip.destination,
        tripCount: 0,
        avgFareAccumulator: [],
      });
    }
    const r = routes.get(key);
    r.tripCount += 1;
    r.avgFareAccumulator.push(trip.price);
  }

  const routeRows = Array.from(routes.values())
    .map((r) => ({
      id: r.id,
      route: r.route,
      origin: r.origin,
      destination: r.destination,
      tripCount: r.tripCount,
      avgFare: round2(mean(r.avgFareAccumulator)),
    }))
    .sort((a, b) => b.tripCount - a.tripCount)
    .slice(0, 8);

  const nextTrip = tripRows.find((t) => new Date(t.departureTime) >= now) || null;

  return {
    scope: "passenger",
    source: "database",
    generatedAt: new Date().toISOString(),
    trips: tripRows,
    routes: routeRows,
    pricing: {
      minFare: prices.length ? round2(Math.min(...prices)) : 0,
      maxFare: prices.length ? round2(Math.max(...prices)) : 0,
      avgFare: prices.length ? round2(mean(prices)) : 0,
      currency: "KES",
    },
    operations: {
      totalUpcomingTrips: tripRows.length,
      totalRoutes: routeRows.length,
    },
    nextTrip,
    recentBookings: myBookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      amount: safeNumber(booking.amount),
      route: `${booking.trip.route.origin} -> ${booking.trip.route.destination}`,
      departureTime: booking.trip.departureTime,
      saccoName: booking.trip.sacco.name,
    })),
  };
}

export const getAiContext = async (user) => {
  const role = String(user?.role || "USER").toUpperCase();

  if (role === "OWNER") {
    return buildOwnerContext(user?.userId);
  }

  return buildPassengerContext(user?.userId);
};
