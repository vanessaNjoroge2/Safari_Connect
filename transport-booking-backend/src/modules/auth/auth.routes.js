import { Router } from "express";
import { register, login, me, updateMe, changeMyPassword } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMe);
router.patch("/password", authenticate, changeMyPassword);

export default router;