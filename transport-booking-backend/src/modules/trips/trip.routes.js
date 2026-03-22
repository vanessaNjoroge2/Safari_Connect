import { Router } from "express";
import {
  addTrip,
  fetchMyTrips,
  searchAvailableTrips,
  fetchTripById,
  changeTripStatus,
  updateTripHandler,
  deleteTripHandler,
} from "./trip.controller.js";

import { fetchTripSeats } from "../bookings/booking.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("OWNER"), addTrip);
router.get("/me", authenticate, authorize("OWNER"), fetchMyTrips);
router.get("/search", searchAvailableTrips);
router.get("/:tripId/seats", fetchTripSeats);
router.get("/:tripId", fetchTripById);
router.patch("/:tripId", authenticate, authorize("OWNER"), updateTripHandler);
router.patch("/:tripId/status", authenticate, authorize("OWNER"), changeTripStatus);
router.delete("/:tripId", authenticate, authorize("OWNER"), deleteTripHandler);

export default router;