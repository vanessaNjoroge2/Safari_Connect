import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
<<<<<<< Updated upstream
import aiRoutes from "../modules/ai/ai.routes.js";
import mpesaRoutes from "../modules/payments/mpesa.routes.js";
=======
import categoryRoutes from "../modules/categories/category.routes.js";
import saccoRoutes from "../modules/saccos/sacco.routes.js";
import transportRouteRoutes from "../modules/routes/route.routes.js";
import busRoutes from "../modules/buses/bus.routes.js";
import tripRoutes from "../modules/trips/trip.routes.js";
>>>>>>> Stashed changes

const router = Router();

router.use("/auth", authRoutes);
<<<<<<< Updated upstream
router.use("/ai", aiRoutes);
router.use("/payments", mpesaRoutes);
=======
router.use("/categories", categoryRoutes);
router.use("/saccos", saccoRoutes);
router.use("/routes", transportRouteRoutes);
router.use("/buses", busRoutes);
router.use("/trips", tripRoutes);

>>>>>>> Stashed changes

export default router;