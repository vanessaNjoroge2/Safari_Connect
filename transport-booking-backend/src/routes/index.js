import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";

import categoryRoutes from "../modules/categories/category.routes.js";
import adminRoutes from "../modules/admins/admin.routes.js";
import saccoRoutes from "../modules/saccos/sacco.routes.js";
import transportRouteRoutes from "../modules/routes/route.routes.js";
import busRoutes from "../modules/buses/bus.routes.js";
import tripRoutes from "../modules/trips/trip.routes.js";
import bookingRoutes from "../modules/bookings/booking.routes.js";
import paymentRoutes from "../modules/payments/payment.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/categories", categoryRoutes);
router.use("/admins", adminRoutes);
router.use("/saccos", saccoRoutes);
router.use("/routes", transportRouteRoutes);
router.use("/buses", busRoutes);
router.use("/trips", tripRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);

export default router;