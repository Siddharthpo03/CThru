import { Router } from "express";

import { getProfile, login, register } from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validation.middleware.js";

import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);

router.post("/login", validateBody(loginSchema), login);

router.get("/profile", requireAuth, getProfile);

export default router;
