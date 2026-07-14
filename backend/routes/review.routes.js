import { Router } from "express";

import {
  autoCorrectReview,
  createReview,
  deleteReview,
  getDashboardStats,
  getReview,
  getReviews,
} from "../controllers/review.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validation.middleware.js";

import { createReviewSchema } from "../schemas/review.schema.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getDashboardStats);

router.get("/", getReviews);

router.get("/:id", getReview);

router.post("/", validateBody(createReviewSchema), createReview);

router.post("/:id/auto-correct", autoCorrectReview);

router.delete("/:id", deleteReview);

export default router;
