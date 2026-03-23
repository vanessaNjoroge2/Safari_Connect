import {
  getTripSeats,
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingAutofill,
} from "./booking.service.js";

export const fetchTripSeats = async (req, res, next) => {
  try {
    const result = await getTripSeats(req.params.tripId);

    return res.status(200).json({
      success: true,
      message: "Trip seats fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addBooking = async (req, res, next) => {
  try {
    const booking = await createBooking(req.user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchMyBookings = async (req, res, next) => {
  try {
    const bookings = await getMyBookings(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchBookingById = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.user.userId, req.params.bookingId);

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchBookingAutofill = async (req, res, next) => {
  try {
    const data = await getBookingAutofill(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Booking autofill fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
