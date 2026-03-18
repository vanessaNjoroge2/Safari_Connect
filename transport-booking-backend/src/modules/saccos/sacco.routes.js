import { Router } from "express";
import { addSacco, fetchMySacco } from "./sacco.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("OWNER"), addSacco);
router.get("/me", authenticate, authorize("OWNER"), fetchMySacco);

export default router;