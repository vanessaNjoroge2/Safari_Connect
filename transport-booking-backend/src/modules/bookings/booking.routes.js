import { Router } from "express";
import {
  addBooking,
  fetchMyBookings,
  fetchBookingById,
  fetchBookingAutofill,
} from "./booking.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, addBooking);
router.get("/me", authenticate, fetchMyBookings);
router.get("/me/autofill", authenticate, fetchBookingAutofill);
router.get("/:bookingId", authenticate, fetchBookingById);

export default router;
