import { prisma } from "../../config/prisma.js";
import { initiateStkPush, parseMpesaCallback } from "./mpesa.service.js";

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
    throw new Error("Booking not found");
  }

  if (booking.status === "CONFIRMED") {
    throw new Error("This booking is already confirmed");
  }

  if (booking.payment && booking.payment.status === "SUCCESS") {
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
    throw new Error("Payment record not found for this callback");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: parsed.status,
      transactionRef: parsed.mpesaReceiptNumber,
    },
  });

  if (parsed.status === "SUCCESS") {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
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
    throw new Error("Booking not found");
  }

  return {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status,
    payment: booking.payment,
  };
};