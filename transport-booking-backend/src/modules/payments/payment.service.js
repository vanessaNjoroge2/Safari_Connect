import { prisma } from "../../config/prisma.js";
import { initiateStkPush, parseMpesaCallback } from "./mpesa.service.js";
import { logWarn } from "../../utils/logger.js";

export const initiateBookingPayment = async (userId, payload) => {
  const { bookingId, phoneNumber } = payload;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: {
      payment: true,
      trip: {
        include: {
          route: true,
          sacco: true,
        },
      },
      seat: true,
    },
  });

  if (!booking) {
    logWarn("payment.booking_not_found", { userId, bookingId });
    throw new Error("Booking not found");
  }

  if (booking.status === "CONFIRMED") {
    logWarn("payment.booking_already_confirmed", { userId, bookingId });
    throw new Error("This booking is already confirmed");
  }

  if (booking.payment && booking.payment.status === "SUCCESS") {
    logWarn("payment.already_paid", { userId, bookingId });
    throw new Error("Payment already completed for this booking");
  }

  const stkResponse = await initiateStkPush({
    amount: Number(booking.amount),
    phoneNumber,
    accountReference: booking.bookingCode,
    transactionDesc: `${booking.trip.route.origin} to ${booking.trip.route.destination}`,
  });

  const paymentData = {
    userId,
    bookingId: booking.id,
    method: "MPESA",
    amount: booking.amount,
    phoneNumber: stkResponse.normalizedPhoneNumber,
    checkoutRequestId: stkResponse.CheckoutRequestID,
    merchantRequestId: stkResponse.MerchantRequestID,
    status: "PENDING",
    aiAnalysis:
      "AI payment analysis: STK push initiated. Track callback outcome; keep booking in pending state until payment success is confirmed.",
  };

  let payment;

  if (booking.payment) {
    payment = await prisma.payment.update({
      where: { bookingId: booking.id },
      data: paymentData,
    });
  } else {
    payment = await prisma.payment.create({
      data: paymentData,
    });
  }

  return {
    payment,
    stkResponse,
  };
};

export const processMpesaCallback = async (callbackPayload) => {
  const parsed = parseMpesaCallback(callbackPayload);

  const payment = await prisma.payment.findFirst({
    where: {
      checkoutRequestId: parsed.checkoutRequestId,
    },
    include: {
      booking: true,
    },
  });

  if (!payment) {
    logWarn("payment.callback_record_not_found", {
      checkoutRequestId: parsed.checkoutRequestId,
      merchantRequestId: parsed.merchantRequestId,
    });
    throw new Error("Payment record not found for this callback");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: parsed.status,
      transactionRef: parsed.mpesaReceiptNumber,
      aiAnalysis:
        parsed.status === "SUCCESS"
          ? "AI payment analysis: payment succeeded and trust signals are acceptable for auto-confirmation."
          : "AI payment analysis: payment failed. Keep booking non-confirmed and prompt secure retry.",
    },
  });

  if (parsed.status === "SUCCESS") {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: "CONFIRMED",
        aiAnalysis:
          "AI booking analysis: payment success received. Booking promoted to confirmed and seat lock maintained.",
      },
    });
  } else {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        aiAnalysis:
          "AI booking analysis: payment callback did not succeed. Booking remains non-confirmed pending retry or cancellation policy.",
      },
    });
  }

  return {
    payment: updatedPayment,
    callback: parsed,
  };
};

export const getMyPaymentStatus = async (userId, bookingId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: {
      payment: true,
    },
  });

  if (!booking) {
    logWarn("payment.status_booking_not_found", { userId, bookingId });
    throw new Error("Booking not found");
  }

  return {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status,
    payment: booking.payment,
  };
};