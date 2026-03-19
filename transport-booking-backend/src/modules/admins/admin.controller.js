import {
	getAdminDashboard,
	getAdminBookings,
	getAdminPayments,
	getAdminUsers,
	getAdminSaccos,
	createAdminSacco,
	getAdminAnalytics,
	getAdminSupportTickets,
	getAdminSettings,
	updateAdminSettings,
	updateSupportTicketStatus,
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
		const data = await getAdminAnalytics();
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
		const data = await getAdminSupportTickets();
		return res.status(200).json({
			success: true,
			message: "Admin support tickets fetched successfully",
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
		const data = await updateSupportTicketStatus(req.params.ticketId, req.body?.status);
		return res.status(200).json({
			success: true,
			message: "Support ticket updated successfully",
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
