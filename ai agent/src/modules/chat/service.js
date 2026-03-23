const { generateWithGemini } = require("../../shared/gemini");
const { sanitizeText } = require("../../shared/sanitize");

const MAX_HISTORY_MESSAGES = 50;
const MAX_SESSIONS = 1000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 6;
const conversationStore = new Map();

const swahiliHints = {
  recommendation: "Nimepata safari bora kulingana na bei, muda, na uaminifu wa route.",
  pricing: "Ninaweza kukushauri muda wa bei nafuu kabla hujahifadhi.",
  delay: "Ninaweza kukupa tahadhari ya ucheleweshaji kwa route uliyochagua.",
  fraud: "Muamala huu una alama zisizo za kawaida na unahitaji ukaguzi."
};

const englishHints = {
  recommendation: "I found the best trip based on price, time, and reliability.",
  pricing: "I can suggest a cheaper departure window before booking.",
  delay: "I can flag delay risk for your selected route.",
  fraud: "This transaction shows unusual behavior and needs review.",
  trust: "I cannot directly read your account trust score in chat, but I can guide what improves it quickly."
};

const INTENT_KEYWORDS = {
  pricing: ["cheap", "cheapest", "low fare", "budget", "price", "fare", "bei", "nafuu", "gharama"],
  delay: ["delay", "late", "traffic", "jam", "arrival", "schedule", "uchelewesh", "chelewa"],
  fraud: ["fraud", "scam", "suspicious", "chargeback", "risk", "anomaly", "tapeli"],
  trust: ["trust score", "trust", "rating", "score", "uaminifu"],
  recommendation: ["route", "trip", "travel", "recommend", "best option", "suggest"]
};

const PRIORITY_KEYWORDS = {
  cheapest: ["cheap", "cheapest", "lowest", "budget", "bei nafuu", "nafuu"],
  fastest: ["fast", "fastest", "quick", "quickest", "haraka", "faster"],
  reliable: ["reliable", "safe", "stable", "uaminifu", "on time", "dependable"]
};

function inferIntent(text) {
  const lower = (text || "").toLowerCase();
  const scores = {
    recommendation: 0,
    pricing: 0,
    delay: 0,
    fraud: 0,
    trust: 0,
  };

  for (const [intent, terms] of Object.entries(INTENT_KEYWORDS)) {
    for (const term of terms) {
      if (!lower.includes(term)) continue;
      if (intent === "trust" && term === "trust") {
        scores[intent] += lower.includes("trust score") ? 2 : 1;
      } else {
        scores[intent] += term.includes(" ") ? 2 : 1;
      }
    }
  }

  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = ordered[0];

  if (!topScore) return "recommendation";

  // If pricing and recommendation are tied, prefer pricing for actionable fare guidance.
  if (
    topIntent === "recommendation" &&
    scores.pricing === topScore &&
    scores.pricing > 0
  ) {
    return "pricing";
  }

  return topIntent;
}

function extractPriority(text) {
  const lower = String(text || "").toLowerCase();
  const scores = { cheapest: 0, fastest: 0, reliable: 0 };

  for (const [priority, terms] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const term of terms) {
      if (lower.includes(term)) {
        scores[priority] += term.includes(" ") ? 2 : 1;
      }
    }
  }

  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, score] = ordered[0];
  return score > 0 ? winner : null;
}

function cleanPlace(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function looksLikePlace(value) {
  const v = String(value || "").toLowerCase().trim();
  if (!v) return false;
  if (/\d/.test(v)) return false;
  if (/(find|cheapest|cheap|route|book|booking|bus|fare|price|travel|trip|recommend)/.test(v)) {
    return false;
  }
  return true;
}

function extractRoute(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");

  const patterns = [
    /\bfrom\s+([a-zA-Z\s-]{2,40}?)\s+(?:to|\-|→)\s+([a-zA-Z\s-]{2,40})\b/i,
    /\b([a-zA-Z\s-]{2,40}?)\s+(?:to|\-|→)\s+([a-zA-Z\s-]{2,40})\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const origin = cleanPlace(match[1]);
      const destination = cleanPlace(match[2]);
      if (
        origin &&
        destination &&
        looksLikePlace(origin) &&
        looksLikePlace(destination) &&
        origin.toLowerCase() !== destination.toLowerCase()
      ) {
        return { origin, destination };
      }
    }
  }

  return { origin: null, destination: null };
}

function extractFromOnly(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const match = normalized.match(/\bfrom\s+([a-zA-Z\s-]{2,40})(?=$|\s+(?:to|on|at|for|with|budget|ksh|kes)|[,.!?])/i);
  if (!match) return null;
  const origin = cleanPlace(match[1]);
  return origin && looksLikePlace(origin) ? origin : null;
}

function extractToOnly(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const match = normalized.match(/\bto\s+([a-zA-Z\s-]{2,40})(?=$|\s+(?:on|at|for|with|budget|ksh|kes)|[,.!?])/i);
  if (!match) return null;
  const destination = cleanPlace(match[1]);
  return destination && looksLikePlace(destination) ? destination : null;
}

function isMostlyPlaceText(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (/\d/.test(value)) return false;
  if (/(budget|ksh|kes|date|time|am|pm|tomorrow|today|cheapest|route|book|fare)/i.test(value)) return false;
  return /^[a-zA-Z\s,-]{2,60}$/.test(value);
}

function extractLeadingPlace(text) {
  const value = String(text || "").trim();
  const match = value.match(/^([a-zA-Z\s-]{2,30})(?:,|$)/);
  if (!match) return null;
  const place = cleanPlace(match[1]);
  return place && looksLikePlace(place) ? place : null;
}

function extractDate(text) {
  const value = String(text || "");
  const monthMap = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const toIso = (year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const candidate = new Date(Date.UTC(y, m - 1, d));
    if (
      candidate.getUTCFullYear() !== y ||
      candidate.getUTCMonth() + 1 !== m ||
      candidate.getUTCDate() !== d
    ) {
      return null;
    }
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const withMonthName = (dayValue, monthToken, yearValue) => {
    const month = monthMap[String(monthToken || "").toLowerCase()];
    if (!month) return null;

    const currentYear = new Date().getFullYear();
    const year = yearValue ? Number(yearValue) : currentYear;
    return toIso(year, month, Number(dayValue));
  };

  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = value.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (slash) {
    const day = String(Number(slash[1])).padStart(2, "0");
    const month = String(Number(slash[2])).padStart(2, "0");
    return `${slash[3]}-${month}-${day}`;
  }

  const dayMonthName = value.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*(20\d{2}))?\b/i
  );
  if (dayMonthName) {
    const parsed = withMonthName(dayMonthName[1], dayMonthName[2], dayMonthName[3]);
    if (parsed) return parsed;
  }

  const monthNameDay = value.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(20\d{2}))?\b/i
  );
  if (monthNameDay) {
    const parsed = withMonthName(monthNameDay[2], monthNameDay[1], monthNameDay[3]);
    if (parsed) return parsed;
  }

  const lowered = value.toLowerCase();
  if (lowered.includes("tomorrow") || lowered.includes("kesho")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
      tomorrow.getDate()
    ).padStart(2, "0")}`;
  }

  if (lowered.includes("today") || lowered.includes("leo")) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
  }

  return null;
}

function extractTime(text) {
  const value = String(text || "").toLowerCase();

  const hhmm = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (hhmm) return `${String(hhmm[1]).padStart(2, "0")}:${hhmm[2]}`;

  const ampm = value.match(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/);
  if (ampm) {
    let hour = Number(ampm[1]);
    if (ampm[2] === "pm" && hour < 12) hour += 12;
    if (ampm[2] === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00`;
  }

  return null;
}

function extractBudget(text) {
  const value = String(text || "").toLowerCase();

  const currencyFirst = value.match(/\b(?:ksh|kshs|kes)\s*([0-9]{3,7})\b/);
  if (currencyFirst) return Number(currencyFirst[1]);

  const currencyLast = value.match(/\b([0-9]{3,7})\s*(?:ksh|kshs|kes)\b/);
  if (currencyLast) return Number(currencyLast[1]);

  const budgetWord = value.match(/\bbudget\s*(?:is|:)?\s*([0-9]{3,7})\b/);
  if (budgetWord) return Number(budgetWord[1]);

  return null;
}

function mergeContext(base, update) {
  return {
    origin: update.origin || base.origin,
    destination: update.destination || base.destination,
    travelDate: update.travelDate || base.travelDate,
    departureTime: update.departureTime || base.departureTime,
    budgetKes: update.budgetKes || base.budgetKes,
    priority: update.priority || base.priority,
  };
}

function extractContext(text, baseContext = {}) {
  const route = extractRoute(text);
  let origin = route.origin;
  let destination = route.destination;

  if (!origin) {
    origin = extractFromOnly(text);
  }

  if (!destination) {
    destination = extractToOnly(text);
  }

  if (!origin) {
    const leading = extractLeadingPlace(text);
    if (leading && String(text || "").includes(",")) {
      if (!baseContext.origin) {
        origin = leading;
      } else if (!baseContext.destination && !destination) {
        destination = leading;
      }
    }
  }

  // Handle short follow-up messages like "Nairobi, ksh3000 ..." or "Mombasa Diani".
  if (!origin && !destination && isMostlyPlaceText(text)) {
    const leading = extractLeadingPlace(text) || cleanPlace(text);
    if (leading) {
      if (!baseContext.origin) {
        origin = leading;
      } else if (!baseContext.destination) {
        destination = leading;
      }
    }
  }

  return {
    origin,
    destination,
    travelDate: extractDate(text),
    departureTime: extractTime(text),
    budgetKes: extractBudget(text),
    priority: extractPriority(text),
  };
}

function buildConversationContext(userMessages) {
  return userMessages.reduce(
    (acc, item) => mergeContext(acc, extractContext(item.text || "", acc)),
    {
      origin: null,
      destination: null,
      travelDate: null,
      departureTime: null,
      budgetKes: null,
      priority: null,
    }
  );
}

function requiredMissing(context) {
  const missing = [];
  if (!context.origin) missing.push("origin");
  if (!context.destination) missing.push("destination");
  if (!context.travelDate) missing.push("date");
  if (!context.budgetKes) missing.push("budget");
  return missing;
}

function buildClarificationQuestion(language, missing) {
  const humanJoin = (items, conjunction) => {
    if (items.length <= 1) return items[0] || "";
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
  };

  if (language === "sw") {
    const parts = [];
    if (missing.includes("origin")) parts.push("sehemu ya kuanzia");
    if (missing.includes("destination")) parts.push("sehemu ya kufika");
    if (missing.includes("date")) parts.push("tarehe ya safari");
    if (missing.includes("budget")) parts.push("bajeti yako");
    return `Asante. Tafadhali nisaidie ${humanJoin(parts, "na")} ili nitoe mapendekezo sahihi.`;
  }

  const parts = [];
  if (missing.includes("origin")) parts.push("origin");
  if (missing.includes("destination")) parts.push("destination");
  if (missing.includes("date")) parts.push("travel date");
  if (missing.includes("budget")) parts.push("budget");
  return `Thanks. Please share your ${humanJoin(parts, "and")} so I can give a precise recommendation.`;
}

function buildProfessionalRecommendation(language, context, intent) {
  const route = `${context.origin} -> ${context.destination}`;
  const date = context.travelDate;
  const time = context.departureTime || "morning";
  const budget = context.budgetKes;
  const priority = context.priority || (intent === "pricing" ? "cheapest" : null);

  const enPriorityGuidance = {
    cheapest: "Prioritize standard off-peak departures and compare at least 2 nearby time slots.",
    fastest: "Prioritize trips with fewer stops and early departure windows with lower traffic exposure.",
    reliable: "Prioritize operators with strong on-time history and avoid tight transfer windows.",
  };

  const swPriorityGuidance = {
    cheapest: "Kipaumbele kiwe safari za kawaida zisizo peak na ulinganishe saa mbili za karibu.",
    fastest: "Chagua safari zenye vituo vichache na muda wa kuondoka usio na msongamano mkubwa.",
    reliable: "Chagua wasafirishaji wenye historia nzuri ya kufika kwa wakati na epuka mipango ya kubadilisha gari haraka.",
  };

  if (language === "sw") {
    if (priority) {
      return `Sawa. Kwa ${route} tarehe ${date}, muda wa ${time}, na bajeti ya KES ${budget}, kipaumbele chako ni ${priority}. ${swPriorityGuidance[priority]} Nikitaka nikuhesabie chaguo moja bora, niambie kama muda unaweza kubadilika kwa dakika 30-60.`;
    }

    return `Sawa. Kwa ${route} tarehe ${date}, muda wa ${time}, na bajeti ya KES ${budget}, una nafasi nzuri ya kupata safari ya kawaida. Niambie kipaumbele chako (bei nafuu, haraka, au uaminifu) nikupatie chaguo moja moja kwa moja.`;
  }

  if (priority) {
    return `Great. For ${route} on ${date} around ${time} with a KES ${budget} budget, your stated priority is ${priority}. ${enPriorityGuidance[priority]} If you want one concrete pick, tell me whether a 30-60 minute time shift is acceptable.`;
  }

  return `Great. For ${route} on ${date} around ${time} with a KES ${budget} budget, you are in a strong range for standard coach options. Tell me your priority (cheapest, fastest, or reliable) and I will provide one clear recommendation.`;
}

function buildSearchAction(context, intent) {
  if (!context.origin || !context.destination || !context.travelDate) {
    return null;
  }

  return {
    type: "prefill_search_form",
    params: {
      category: "bus",
      from: context.origin,
      to: context.destination,
      date: context.travelDate,
      time: context.departureTime || undefined,
      maxFare: context.budgetKes || undefined,
      priority: context.priority || (intent === "pricing" ? "cheapest" : undefined),
      auto: 0,
    },
    confidence: 0.86,
  };
}

function wantsBookingHelp(text) {
  const lower = String(text || "").toLowerCase();
  const terms = [
    "help me book",
    "book for me",
    "assist booking",
    "continue booking",
    "go ahead and book",
    "nisaidie booking",
    "nisaidie kuweka booking",
    "endelea booking",
  ];

  return terms.some((term) => lower.includes(term));
}

function parseRouteLabel(route) {
  const parts = String(route || "")
    .split(/->|→/)
    .map((p) => cleanPlace(p))
    .filter(Boolean);

  if (parts.length < 2) {
    return { origin: null, destination: null };
  }

  return {
    origin: parts[0],
    destination: parts[1],
  };
}

function deriveDbContext(dbContext = {}) {
  if (!dbContext || dbContext.scope !== "passenger") {
    return {
      origin: null,
      destination: null,
      travelDate: null,
      departureTime: null,
      budgetKes: null,
      priority: null,
    };
  }

  const recentBooking = Array.isArray(dbContext.recentBookings)
    ? dbContext.recentBookings[0] || null
    : null;
  const nextTrip = dbContext.nextTrip || null;
  const recentRoute = parseRouteLabel(recentBooking?.route || "");

  const nextDeparture = nextTrip?.departureTime ? new Date(nextTrip.departureTime) : null;
  const safeDate = nextDeparture && !Number.isNaN(nextDeparture.getTime())
    ? nextDeparture.toISOString().slice(0, 10)
    : null;
  const safeTime = nextDeparture && !Number.isNaN(nextDeparture.getTime())
    ? `${String(nextDeparture.getHours()).padStart(2, "0")}:${String(nextDeparture.getMinutes()).padStart(2, "0")}`
    : null;

  return {
    origin: recentRoute.origin || nextTrip?.origin || null,
    destination: recentRoute.destination || nextTrip?.destination || null,
    travelDate: safeDate,
    departureTime: safeTime,
    budgetKes: Number(dbContext?.pricing?.avgFare) || Number(recentBooking?.amount) || null,
    priority: null,
  };
}

function asksForKnownSlots(message) {
  const text = String(message || "").toLowerCase();
  const patterns = [
    /what\s+time\s+would\s+you\s+like/,
    /what\s+is\s+your\s+budget/,
    /what\s+date\s+are\s+you\s+planning/,
    /what\s+date\s+and\s+time\s+are\s+you\s+planning/,
    /specify\s+your\s+origin\s+and\s+destination/,
  ];

  return patterns.some((re) => re.test(text));
}

function sanitizeSessionId(value) {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9:_\-.]/g, "")
    .slice(0, 80);
  return clean || null;
}

function pruneStore() {
  const now = Date.now();

  for (const [key, session] of conversationStore.entries()) {
    if (!session || now - session.lastSeenAt > SESSION_TTL_MS) {
      conversationStore.delete(key);
    }
  }

  if (conversationStore.size <= MAX_SESSIONS) return;

  const entries = Array.from(conversationStore.entries()).sort(
    (a, b) => (a[1]?.lastSeenAt || 0) - (b[1]?.lastSeenAt || 0)
  );

  const overflow = conversationStore.size - MAX_SESSIONS;
  for (let i = 0; i < overflow; i += 1) {
    conversationStore.delete(entries[i][0]);
  }
}

function getSessionMessages(sessionId) {
  if (!sessionId) return [];

  const existing = conversationStore.get(sessionId);
  if (!existing) {
    conversationStore.set(sessionId, { messages: [], lastSeenAt: Date.now() });
    return [];
  }

  existing.lastSeenAt = Date.now();
  return existing.messages || [];
}

function appendSessionMessages(sessionId, additions) {
  if (!sessionId) return;

  const existing = conversationStore.get(sessionId) || { messages: [], lastSeenAt: Date.now() };
  const merged = [...existing.messages, ...additions].slice(-MAX_HISTORY_MESSAGES);

  conversationStore.set(sessionId, {
    messages: merged,
    lastSeenAt: Date.now(),
  });

  pruneStore();
}

async function respondToPrompt({ text, language = "en", sessionId, role = "USER", context = null }) {
  const userText = sanitizeText(text, 500);
  const resolvedSessionId = sanitizeSessionId(sessionId);
  const history = getSessionMessages(resolvedSessionId);
  const memoryForIntent = history.map((item) => item.text).join(" ");
  const intent = inferIntent(`${memoryForIntent} ${userText}`);
  const hints = language === "sw" ? swahiliHints : englishHints;
  const fallbackMessage = hints[intent] || hints.recommendation;
  const userHistory = history.filter((item) => item.role === "user");
  const dbContext = deriveDbContext(context);
  const inferredContext = buildConversationContext([...userHistory, { text: userText }]);
  const conversationContext = mergeContext(dbContext, inferredContext);
  const allowBookingAction = String(role || "USER").toUpperCase() === "USER" && wantsBookingHelp(userText);
  const missing = requiredMissing(conversationContext);

  if (!userText) {
    return {
      intent,
      message: fallbackMessage,
      action: null,
      source: "fallback",
      modelUsed: null,
      sessionId: resolvedSessionId,
      memoryCount: history.length
    };
  }

  if (intent === "trust") {
    const trustMessage =
      language === "sw"
        ? "Siwezi kuona trust score yako binafsi moja kwa moja kwenye chat hii. Fungua Profile ili uone score halisi; ukitaka, naweza kukuambia hatua 3 za kuiboresha haraka."
        : "I cannot directly read your personal trust score in this chat. Open your Profile for the live score; I can also share 3 quick actions to improve it.";

    appendSessionMessages(resolvedSessionId, [
      { role: "user", text: userText },
      { role: "assistant", text: sanitizeText(trustMessage, 500) },
    ]);

    const updatedTrustHistory = getSessionMessages(resolvedSessionId);
    return {
      intent,
      message: trustMessage,
      action: null,
      source: "fallback",
      modelUsed: null,
      sessionId: resolvedSessionId,
      memoryCount: updatedTrustHistory.length,
      disclaimer: "Response generated from deterministic fallback guidance."
    };
  }

  if ((intent === "recommendation" || intent === "pricing") && missing.length === 0) {
    const proMessage = buildProfessionalRecommendation(language, conversationContext, intent);
    const action = buildSearchAction(conversationContext, intent);

    appendSessionMessages(resolvedSessionId, [
      { role: "user", text: userText },
      { role: "assistant", text: sanitizeText(proMessage, 500) },
    ]);

    const updatedProHistory = getSessionMessages(resolvedSessionId);
    return {
      intent,
      message: proMessage,
      action: allowBookingAction ? action : null,
      source: "fallback",
      modelUsed: null,
      sessionId: resolvedSessionId,
      memoryCount: updatedProHistory.length,
      disclaimer: "Response generated from deterministic fallback guidance."
    };
  }

  if ((intent === "recommendation" || intent === "pricing") && missing.length > 0) {
    const clarify = buildClarificationQuestion(language, missing);

    appendSessionMessages(resolvedSessionId, [
      { role: "user", text: userText },
      { role: "assistant", text: sanitizeText(clarify, 500) },
    ]);

    const updatedClarifyHistory = getSessionMessages(resolvedSessionId);
    return {
      intent,
      message: clarify,
      action: null,
      source: "fallback",
      modelUsed: null,
      sessionId: resolvedSessionId,
      memoryCount: updatedClarifyHistory.length,
      disclaimer: "Response generated from deterministic fallback guidance."
    };
  }

  const historyBlock = history
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.text}`)
    .join("\n");

  const prompt = [
    "You are Safari Connect AI agent for transport booking decisions.",
    `Language: ${language}.`,
    `Detected intent: ${intent}.`,
    `Conversation memory (up to ${MAX_HISTORY_MESSAGES} messages, oldest to newest):`,
    historyBlock || "No previous messages.",
    `Known travel context: ${JSON.stringify(conversationContext)}.`,
    `Known user priority: ${conversationContext.priority || "none"}.`,
    `Booking-action requested by user: ${allowBookingAction ? "yes" : "no"}.`,
    `Missing travel fields: ${missing.join(", ") || "none"}.`,
    "Never ask for details that already exist in known travel context.",
    "Respond in 1-2 concise sentences and provide practical guidance.",
    "Do not invent live prices, schedules, or seat availability.",
    "If data is missing, ask for route, date/time, and budget in one short question.",
    "Use cautious wording: based on the provided input.",
    `User message: ${userText}`
  ].join("\n");

  const result = await generateWithGemini({ prompt });
  let finalMessage = result.text || fallbackMessage;

  if ((intent === "recommendation" || intent === "pricing") && missing.length === 0 && asksForKnownSlots(finalMessage)) {
    finalMessage = buildProfessionalRecommendation(language, conversationContext, intent);
  }

  appendSessionMessages(resolvedSessionId, [
    { role: "user", text: userText },
    { role: "assistant", text: sanitizeText(finalMessage, 500) },
  ]);

  const updatedHistory = getSessionMessages(resolvedSessionId);

  return {
    intent,
    message: finalMessage,
    action: allowBookingAction && (intent === "recommendation" || intent === "pricing") && missing.length === 0
      ? buildSearchAction(conversationContext, intent)
      : null,
    source: result.source,
    modelUsed: result.modelUsed,
    sessionId: resolvedSessionId,
    memoryCount: updatedHistory.length,
    disclaimer:
      result.source === "fallback"
        ? "Response generated from deterministic fallback guidance."
        : "Response generated by Gemini from provided context."
  };
}

module.exports = {
  respondToPrompt
};
