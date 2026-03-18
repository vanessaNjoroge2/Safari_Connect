import { initiatePaymentSchema } from "./payment.validation.js";
import {
  initiateBookingPayment,
  processMpesaCallback,
  getMyPaymentStatus,
} from "./payment.service.js";

export const stkPush = async (req, res, next) => {
  try {
    const payload = initiatePaymentSchema.parse(req.body);
    const result = await initiateBookingPayment(req.user.userId, payload);

    return res.status(200).json({
      success: true,
      message: "STK push initiated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const mpesaCallback = async (req, res, next) => {
  try {
    console.log("M-PESA CALLBACK RECEIVED:", JSON.stringify(req.body, null, 2));
    const result = await processMpesaCallback(req.body || {});

    return res.status(200).json({
      success: true,
      message: "Callback processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentStatus = async (req, res, next) => {
  try {
    const result = await getMyPaymentStatus(req.user.userId, req.params.bookingId);

    return res.status(200).json({
      success: true,
      message: "Payment status fetched",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};