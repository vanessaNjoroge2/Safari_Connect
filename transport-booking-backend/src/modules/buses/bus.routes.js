import { Router } from "express";
import {
  addBus,
  fetchMyBuses,
  addBusSeats,
  fetchBusSeats,
  updateBusHandler,
  deleteBusHandler,
  replaceBusSeatsHandler,
  deleteBusSeatsHandler,
} from "./bus.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("OWNER"), addBus);
router.get("/me", authenticate, authorize("OWNER"), fetchMyBuses);
router.patch("/:busId", authenticate, authorize("OWNER"), updateBusHandler);
router.delete("/:busId", authenticate, authorize("OWNER"), deleteBusHandler);
router.post("/:busId/seats", authenticate, authorize("OWNER"), addBusSeats);
router.get("/:busId/seats", authenticate, authorize("OWNER"), fetchBusSeats);
router.patch("/:busId/seats", authenticate, authorize("OWNER"), replaceBusSeatsHandler);
router.delete("/:busId/seats", authenticate, authorize("OWNER"), deleteBusSeatsHandler);

export default router;