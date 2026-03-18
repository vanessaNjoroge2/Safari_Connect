import { Router } from "express";
import {
  fetchCategories,
  addCategory,
} from "./category.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", fetchCategories);
router.post("/", authenticate, authorize("OWNER"), addCategory);

export default router;