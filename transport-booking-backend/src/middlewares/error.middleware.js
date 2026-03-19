import { ZodError } from "zod";
import { logError } from "../utils/logger.js";

export const errorHandler = (error, req, res, next) => {
  if (error instanceof ZodError) {
    logError("validation.error", {
      path: req.path,
      method: req.method,
      issues: error.issues,
    });

    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const statusCode = Number(error?.statusCode || 400);

  logError("request.error", {
    path: req.path,
    method: req.method,
    statusCode,
    message: error?.message,
  });

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
};