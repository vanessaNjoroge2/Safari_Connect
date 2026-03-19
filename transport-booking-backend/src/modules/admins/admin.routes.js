import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
	fetchAdminDashboard,
	fetchAdminBookings,
	fetchAdminPayments,
	fetchAdminUsers,
	fetchAdminSaccos,
	addAdminSacco,
	fetchAdminAnalytics,
	fetchAdminSupportTickets,
	fetchAdminSettings,
	updateAdminSettingsHandler,
	updateAdminTicketHandler,
	updateAdminSaccoStatus,
	updateAdminUserStatus,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));
router.get("/dashboard", fetchAdminDashboard);
router.get("/bookings", fetchAdminBookings);
router.get("/payments", fetchAdminPayments);
router.get("/users", fetchAdminUsers);
router.get("/saccos", fetchAdminSaccos);
router.post("/saccos", addAdminSacco);
router.get("/analytics", fetchAdminAnalytics);
router.get("/support", fetchAdminSupportTickets);
router.get("/settings", fetchAdminSettings);
router.patch("/settings", updateAdminSettingsHandler);
router.patch("/support/:ticketId", updateAdminTicketHandler);
router.patch("/saccos/:saccoId", updateAdminSaccoStatus);
router.patch("/users/:userId", updateAdminUserStatus);

export default router;
