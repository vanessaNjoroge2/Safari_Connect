import { Router } from "express";
import {
  addBus,
  fetchMyBuses,
  addBusSeats,
  fetchBusSeats,
} from "./bus.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("OWNER"), addBus);
router.get("/me", authenticate, authorize("OWNER"), fetchMyBuses);
router.post("/:busId/seats", authenticate, authorize("OWNER"), addBusSeats);
router.get("/:busId/seats", authenticate, authorize("OWNER"), fetchBusSeats);

export default router;