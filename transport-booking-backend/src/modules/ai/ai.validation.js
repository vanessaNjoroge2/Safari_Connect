import { z } from "zod";

const flexibleObjectSchema = z.object({}).catchall(z.unknown());

export const aiAssistSchema = z.object({
  trips: z.array(flexibleObjectSchema).default([]),
  intent: flexibleObjectSchema.default({}),
  route: z.string().optional(),
  departureTime: z.string().optional(),
  currentPrice: z.coerce.number().optional(),
  riskFactors: flexibleObjectSchema.default({}),
  fraudSignals: flexibleObjectSchema.default({}),
  prompt: z.string().max(500).optional(),
  language: z.string().optional(),
  sessionId: z.string().max(80).optional()
});

export const aiChatSchema = z.object({
  text: z.string().min(1).max(500),
  language: z.string().optional(),
  sessionId: z.string().max(80).optional()
});

export const aiVoiceSchema = z.object({
  transcript: z.string().min(1).max(500),
  language: z.string().optional()
});
