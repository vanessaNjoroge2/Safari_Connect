import { Router } from "express";
import { addRoute, fetchRoutes, updateRouteHandler, deleteRouteHandler } from "./route.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", fetchRoutes);
router.post("/", authenticate, authorize("OWNER", "ADMIN"), addRoute);
router.patch("/:routeId", authenticate, authorize("OWNER", "ADMIN"), updateRouteHandler);
router.delete("/:routeId", authenticate, authorize("OWNER", "ADMIN"), deleteRouteHandler);

export default router;