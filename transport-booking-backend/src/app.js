import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { logInfo } from "./utils/logger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api/payments")) return;

    logInfo("http.request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      requestId: req.headers["x-request-id"] || null,
    });
  });
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Transport Booking API is running",
  });
});

app.use("/api", routes);
app.use(errorHandler);

export default app;