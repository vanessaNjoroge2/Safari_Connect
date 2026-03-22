import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { fetchPortalHelpArticles, fetchPortalNotifications } from "./portal.controller.js";

const router = Router();

router.use(authenticate, authorize("USER", "OWNER"));
router.get("/notifications", fetchPortalNotifications);
router.get("/help", fetchPortalHelpArticles);

export default router;
