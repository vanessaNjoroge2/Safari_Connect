import { z } from "zod";

export const initiatePaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  phoneNumber: z.string().min(10, "Phone number is required"),
});