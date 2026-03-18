import {
  createTrip,
  getMyTrips,
  searchTrips,
  getTripById,
  updateTripStatus,
} from "./trip.service.js";

export const addTrip = async (req, res, next) => {
  try {
    const trip = await createTrip(req.user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchMyTrips = async (req, res, next) => {
  try {
    const trips = await getMyTrips(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Trips fetched successfully",
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

export const searchAvailableTrips = async (req, res, next) => {
  try {
    const trips = await searchTrips(req.query);

    return res.status(200).json({
      success: true,
      message: "Trips fetched successfully",
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchTripById = async (req, res, next) => {
  try {
    const trip = await getTripById(req.params.tripId);

    return res.status(200).json({
      success: true,
      message: "Trip fetched successfully",
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const changeTripStatus = async (req, res, next) => {
  try {
    const trip = await updateTripStatus(
      req.user.userId,
      req.params.tripId,
      req.body.status
    );

    return res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};