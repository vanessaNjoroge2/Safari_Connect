import { Router } from "express";
import {
  fetchCategories,
  addCategory,
  editCategory,
  removeCategory,
} from "./category.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", fetchCategories);
router.post("/", authenticate, authorize("ADMIN"), addCategory);
router.patch("/:categoryId", authenticate, authorize("ADMIN"), editCategory);
router.delete("/:categoryId", authenticate, authorize("ADMIN"), removeCategory);

export default router;