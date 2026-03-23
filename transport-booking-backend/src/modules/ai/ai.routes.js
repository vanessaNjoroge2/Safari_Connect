import { Router } from "express";
import { assist, chat, context, health, voice } from "./ai.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/health", health);
router.get("/context", authenticate, context);
router.post("/assist", assist);
router.post("/chat", authenticate, chat);
router.post("/voice", voice);

export default router;
