import { Router } from "express";
import {
  stkPush,
  mpesaCallback,
  paymentStatus,
} from "./payment.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/stk-push", authenticate, stkPush);
router.post("/mpesa-callback", mpesaCallback);
router.get("/status/:bookingId", authenticate, paymentStatus);

// Backward-compatible aliases for legacy clients
router.post("/stkpush", authenticate, stkPush);
router.post("/payment/stk-push", authenticate, stkPush);
router.get("/payment/status/:bookingId", authenticate, paymentStatus);

export default router;