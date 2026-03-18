import { Router } from "express";
import { addRoute, fetchRoutes } from "./route.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", fetchRoutes);
router.post("/", authenticate, authorize("OWNER", "ADMIN"), addRoute);

export default router;