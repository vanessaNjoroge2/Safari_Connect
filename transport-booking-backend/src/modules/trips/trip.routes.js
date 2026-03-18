import { Router } from "express";
import {
  addTrip,
  fetchMyTrips,
  searchAvailableTrips,
  fetchTripById,
  changeTripStatus,
} from "./trip.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("OWNER"), addTrip);
router.get("/me", authenticate, authorize("OWNER"), fetchMyTrips);
router.get("/search", searchAvailableTrips);
router.get("/:tripId", fetchTripById);
router.patch("/:tripId/status", authenticate, authorize("OWNER"), changeTripStatus);

export default router;