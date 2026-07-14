import "dotenv/config";

import cors from "cors";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import reviewRoutes from "./routes/review.routes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "CThru API is running.",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/reviews", reviewRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
