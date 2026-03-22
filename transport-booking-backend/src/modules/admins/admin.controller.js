import {
	getAdminDashboard,
	getAdminBookings,
	getAdminPayments,
	getAdminUsers,
	getAdminSaccos,
	createAdminSacco,
	getAdminAnalytics,
	getAdminSupportTickets,
	createAdminSupportTicket,
	getAdminSettings,
	updateAdminSettings,
	updateSupportTicketStatus,
	deleteSupportTicket,
	getAdminNotifications,
	createAdminNotification,
	updateAdminNotification,
	deleteAdminNotification,
	getAdminHelpArticles,
	createAdminHelpArticle,
	updateAdminHelpArticle,
	deleteAdminHelpArticle,
	setSaccoActiveState,
	setUserStatus,
} from "./admin.service.js";

export const fetchAdminDashboard = async (req, res, next) => {
	try {
		const data = await getAdminDashboard();
		return res.status(200).json({
			success: true,
			message: "Admin dashboard fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminBookings = async (req, res, next) => {
	try {
		const data = await getAdminBookings(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin bookings fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminPayments = async (req, res, next) => {
	try {
		const data = await getAdminPayments(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin payments fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminUsers = async (req, res, next) => {
	try {
		const data = await getAdminUsers(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin users fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminSaccos = async (req, res, next) => {
	try {
		const data = await getAdminSaccos(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin saccos fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const addAdminSacco = async (req, res, next) => {
	try {
		const data = await createAdminSacco(req.body);
		return res.status(201).json({
			success: true,
			message: "Sacco created successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminAnalytics = async (req, res, next) => {
	try {
		const data = await getAdminAnalytics(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin analytics fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminSupportTickets = async (req, res, next) => {
	try {
		const data = await getAdminSupportTickets(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin support tickets fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const createAdminTicketHandler = async (req, res, next) => {
	try {
		const data = await createAdminSupportTicket(req.body || {});
		return res.status(201).json({
			success: true,
			message: "Support ticket created successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminSettings = async (req, res, next) => {
	try {
		const data = await getAdminSettings();
		return res.status(200).json({
			success: true,
			message: "Admin settings fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminSettingsHandler = async (req, res, next) => {
	try {
		const data = await updateAdminSettings(req.body || {});
		return res.status(200).json({
			success: true,
			message: "Admin settings updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminTicketHandler = async (req, res, next) => {
	try {
		const data = await updateSupportTicketStatus(req.params.ticketId, req.body || {});
		return res.status(200).json({
			success: true,
			message: "Support ticket updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteAdminTicketHandler = async (req, res, next) => {
	try {
		const data = await deleteSupportTicket(req.params.ticketId);
		return res.status(200).json({
			success: true,
			message: "Support ticket deleted successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminNotifications = async (req, res, next) => {
	try {
		const data = await getAdminNotifications(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin notifications fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const createAdminNotificationHandler = async (req, res, next) => {
	try {
		const data = await createAdminNotification(req.body || {});
		return res.status(201).json({
			success: true,
			message: "Notification created successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminNotificationHandler = async (req, res, next) => {
	try {
		const data = await updateAdminNotification(req.params.notificationId, req.body || {});
		return res.status(200).json({
			success: true,
			message: "Notification updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteAdminNotificationHandler = async (req, res, next) => {
	try {
		const data = await deleteAdminNotification(req.params.notificationId);
		return res.status(200).json({
			success: true,
			message: "Notification deleted successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const fetchAdminHelpArticles = async (req, res, next) => {
	try {
		const data = await getAdminHelpArticles(req.query || {});
		return res.status(200).json({
			success: true,
			message: "Admin help articles fetched successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const createAdminHelpArticleHandler = async (req, res, next) => {
	try {
		const data = await createAdminHelpArticle(req.body || {});
		return res.status(201).json({
			success: true,
			message: "Help article created successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminHelpArticleHandler = async (req, res, next) => {
	try {
		const data = await updateAdminHelpArticle(req.params.helpId, req.body || {});
		return res.status(200).json({
			success: true,
			message: "Help article updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteAdminHelpArticleHandler = async (req, res, next) => {
	try {
		const data = await deleteAdminHelpArticle(req.params.helpId);
		return res.status(200).json({
			success: true,
			message: "Help article deleted successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminSaccoStatus = async (req, res, next) => {
	try {
		const data = await setSaccoActiveState(req.params.saccoId, req.body?.isActive);
		return res.status(200).json({
			success: true,
			message: "Sacco status updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};

export const updateAdminUserStatus = async (req, res, next) => {
	try {
		const data = await setUserStatus(req.params.userId, req.body?.status);
		return res.status(200).json({
			success: true,
			message: "User status updated successfully",
			data,
		});
	} catch (error) {
		next(error);
	}
};
