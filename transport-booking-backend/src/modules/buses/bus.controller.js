import {
  createBus,
  getMyBuses,
  createSeatsForBus,
  getBusSeats,
  updateBus,
  deleteBus,
  replaceSeatsForBus,
  deleteSeatsForBus,
} from "./bus.service.js";

export const addBus = async (req, res, next) => {
  try {
    const bus = await createBus(req.user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Bus created successfully",
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchMyBuses = async (req, res, next) => {
  try {
    const buses = await getMyBuses(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Buses fetched successfully",
      data: buses,
    });
  } catch (error) {
    next(error);
  }
};

export const addBusSeats = async (req, res, next) => {
  try {
    const seats = await createSeatsForBus(
      req.user.userId,
      req.params.busId,
      req.body.seats
    );

    return res.status(201).json({
      success: true,
      message: "Seats created successfully",
      data: seats,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchBusSeats = async (req, res, next) => {
  try {
    const seats = await getBusSeats(req.user.userId, req.params.busId);

    return res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      data: seats,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusHandler = async (req, res, next) => {
  try {
    const bus = await updateBus(req.user.userId, req.params.busId, req.body);

    return res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBusHandler = async (req, res, next) => {
  try {
    const result = await deleteBus(req.user.userId, req.params.busId);

    return res.status(200).json({
      success: true,
      message: "Bus deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const replaceBusSeatsHandler = async (req, res, next) => {
  try {
    const seats = await replaceSeatsForBus(
      req.user.userId,
      req.params.busId,
      req.body.seats
    );

    return res.status(200).json({
      success: true,
      message: "Seats updated successfully",
      data: seats,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBusSeatsHandler = async (req, res, next) => {
  try {
    const result = await deleteSeatsForBus(req.user.userId, req.params.busId);

    return res.status(200).json({
      success: true,
      message: "Seats deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};