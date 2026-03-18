import {
  createBus,
  getMyBuses,
  createSeatsForBus,
  getBusSeats,
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