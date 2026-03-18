import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(10).optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "OWNER"]).default("USER"),
});

export const loginSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(6, "Password is required"),
});