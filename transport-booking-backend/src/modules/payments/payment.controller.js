import { initiatePaymentSchema } from "./payment.validation.js";
import {
  initiateBookingPayment,
  processMpesaCallback,
  getMyPaymentStatus,
} from "./payment.service.js";
import { logError, logPaymentEvent } from "../../utils/logger.js";

export const stkPush = async (req, res, next) => {
  try {
    const payload = initiatePaymentSchema.parse(req.body);
    logPaymentEvent("stk_push_requested", {
      userId: req.user?.userId,
      bookingId: payload.bookingId,
      phoneNumber: payload.phoneNumber,
    });

    const result = await initiateBookingPayment(req.user.userId, payload);

    logPaymentEvent("stk_push_accepted", {
      userId: req.user?.userId,
      bookingId: payload.bookingId,
      checkoutRequestId: result?.stkResponse?.CheckoutRequestID || null,
    });

    return res.status(200).json({
      success: true,
      message: "STK push sent successfully",
      data: result,
    });
  } catch (error) {
    logError("payment.stk_push_failed", {
      userId: req.user?.userId,
      message: error?.message,
      statusCode: error?.statusCode || null,
    });
    next(error);
  }
};

export const mpesaCallback = async (req, res, next) => {
  try {
    logPaymentEvent("callback_received", {
      checkoutRequestId: req.body?.Body?.stkCallback?.CheckoutRequestID || null,
      resultCode: req.body?.Body?.stkCallback?.ResultCode,
    });

    const result = await processMpesaCallback(req.body || {});

    logPaymentEvent("callback_processed", {
      checkoutRequestId: result?.callback?.checkoutRequestId || null,
      paymentStatus: result?.payment?.status || null,
      bookingId: result?.payment?.bookingId || null,
    });

    return res.status(200).json({
      success: true,
      message: "Callback processed successfully",
      data: result,
    });
  } catch (error) {
    logError("payment.callback_failed", {
      message: error?.message,
      statusCode: error?.statusCode || null,
    });
    next(error);
  }
};

export const paymentStatus = async (req, res, next) => {
  try {
    const result = await getMyPaymentStatus(req.user.userId, req.params.bookingId);

    logPaymentEvent("status_checked", {
      userId: req.user?.userId,
      bookingId: req.params.bookingId,
      paymentStatus: result?.payment?.status || null,
      bookingStatus: result?.bookingStatus || null,
    });

    return res.status(200).json({
      success: true,
      message: "Payment status fetched",
      data: result,
    });
  } catch (error) {
    logError("payment.status_check_failed", {
      userId: req.user?.userId,
      bookingId: req.params.bookingId,
      message: error?.message,
      statusCode: error?.statusCode || null,
    });
    next(error);
  }
};