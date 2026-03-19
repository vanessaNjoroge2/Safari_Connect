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

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name is required").optional(),
  lastName: z.string().min(2, "Last name is required").optional(),
  email: z.email("Valid email is required").optional(),
  phone: z.string().min(10, "Phone number must have at least 10 digits").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });