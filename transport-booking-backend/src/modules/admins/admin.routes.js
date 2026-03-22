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
	createAdminTicketHandler,
	fetchAdminSettings,
	updateAdminSettingsHandler,
	updateAdminTicketHandler,
	deleteAdminTicketHandler,
	fetchAdminNotifications,
	createAdminNotificationHandler,
	updateAdminNotificationHandler,
	deleteAdminNotificationHandler,
	fetchAdminHelpArticles,
	createAdminHelpArticleHandler,
	updateAdminHelpArticleHandler,
	deleteAdminHelpArticleHandler,
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
router.post("/support", createAdminTicketHandler);
router.get("/settings", fetchAdminSettings);
router.patch("/settings", updateAdminSettingsHandler);
router.patch("/support/:ticketId", updateAdminTicketHandler);
router.delete("/support/:ticketId", deleteAdminTicketHandler);
router.get("/notifications", fetchAdminNotifications);
router.post("/notifications", createAdminNotificationHandler);
router.patch("/notifications/:notificationId", updateAdminNotificationHandler);
router.delete("/notifications/:notificationId", deleteAdminNotificationHandler);
router.get("/help", fetchAdminHelpArticles);
router.post("/help", createAdminHelpArticleHandler);
router.patch("/help/:helpId", updateAdminHelpArticleHandler);
router.delete("/help/:helpId", deleteAdminHelpArticleHandler);
router.patch("/saccos/:saccoId", updateAdminSaccoStatus);
router.patch("/users/:userId", updateAdminUserStatus);

export default router;
