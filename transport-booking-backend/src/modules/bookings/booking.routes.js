import { Router } from "express";
import {
  addBooking,
  fetchMyBookings,
  fetchBookingById,
} from "./booking.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, addBooking);
router.get("/me", authenticate, fetchMyBookings);
router.get("/:bookingId", authenticate, fetchBookingById);

export default router;