import { Buffer } from "node:buffer";
import { env } from "../../config/env.js";
import { generateReference } from "../../utils/generate-ref.js";

function ensureMpesaConfig() {
  const required = [
    ["MPESA_CONSUMER_KEY", env.MPESA_CONSUMER_KEY],
    ["MPESA_CONSUMER_SECRET", env.MPESA_CONSUMER_SECRET],
    ["MPESA_SHORTCODE", env.MPESA_SHORTCODE],
    ["MPESA_PASSKEY", env.MPESA_PASSKEY],
    ["MPESA_AUTH_URL", env.MPESA_AUTH_URL],
    ["MPESA_STK_PUSH_URL", env.MPESA_STK_PUSH_URL],
    ["MPESA_CALLBACK_URL", env.MPESA_CALLBACK_URL],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    const error = new Error(`Missing M-Pesa config: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function getTimestamp() {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, "0");

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;

  const error = new Error("Invalid phone number format. Use 07xxxxxxxx or 2547xxxxxxxx");
  error.statusCode = 400;
  throw error;
}

async function getAccessToken() {
  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await fetch(env.MPESA_AUTH_URL, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    const error = new Error(data.errorMessage || "Failed to get M-Pesa access token");
    error.statusCode = 502;
    throw error;
  }

  return data.access_token;
}

export async function initiateStkPush(payload) {
  ensureMpesaConfig();

  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const phoneNumber = normalizePhone(payload.phoneNumber);

  const requestBody = {
    BusinessShortCode: env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Number(payload.amount),
    PartyA: phoneNumber,
    PartyB: env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: env.MPESA_CALLBACK_URL,
    AccountReference: payload.accountReference || generateReference("BK"),
    TransactionDesc: payload.transactionDesc || "Safari Connect ticket payment",
  };

  const response = await fetch(env.MPESA_STK_PUSH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.errorMessage || "Failed to initiate STK push");
    error.statusCode = 502;
    throw error;
  }

  return {
    ...data,
    normalizedPhoneNumber: phoneNumber,
    accountReference: requestBody.AccountReference,
  };
}

export function parseMpesaCallback(callbackPayload) {
  const stk = callbackPayload?.Body?.stkCallback;

  if (!stk) {
    const error = new Error("Invalid callback payload");
    error.statusCode = 400;
    throw error;
  }

  const metadataItems = stk.CallbackMetadata?.Item || [];
  const metadata = {};

  for (const item of metadataItems) {
    metadata[item.Name] = item.Value;
  }

  return {
    checkoutRequestId: stk.CheckoutRequestID,
    merchantRequestId: stk.MerchantRequestID,
    resultCode: stk.ResultCode,
    resultDesc: stk.ResultDesc,
    status: stk.ResultCode === 0 ? "SUCCESS" : "FAILED",
    amount: metadata.Amount ? Number(metadata.Amount) : null,
    mpesaReceiptNumber: metadata.MpesaReceiptNumber || null,
    transactionDate: metadata.TransactionDate ? String(metadata.TransactionDate) : null,
    phoneNumber: metadata.PhoneNumber ? String(metadata.PhoneNumber) : null,
    raw: callbackPayload,
  };
}