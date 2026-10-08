import bcrypt from "bcryptjs";

import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email.service.js";

import prisma from "../utils/prisma.js";
import { generateToken } from "../utils/jwt.js";

export async function register(req, res) {
  const { name, email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id);

  return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,
    user,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const token = generateToken(user.id);

  return res.status(200).json({
    success: true,
    message: "Signed in successfully.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  // Prevent email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const baseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const resetLink = `${baseUrl}/reset-password/${token}`;

  // Log link in server console for development / monitoring
  console.log(`[PASSWORD RESET] Dispatching reset link to ${user.email}: ${resetLink}`);

  // Dispatch email in background so SMTP latency never blocks the HTTP response
  sendPasswordResetEmail(user.email, resetLink).catch((error) => {
    console.error("Background reset email failed:", error);
  });

  return res.status(200).json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
}

export async function resetPassword(req, res) {
  const { token } = req.params;

  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Password reset link is invalid or has expired.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Password has been reset successfully.",
  });
}

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  return res.status(200).json({
    success: true,
    user,
  });
}

export async function updateProfile(req, res) {
  const { name, email } = req.body;

  const updateData = {};
  if (name && typeof name === "string") {
    updateData.name = name.trim();
  }

  if (email && typeof email === "string") {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.id !== req.userId) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    updateData.email = normalizedEmail;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  const matches = await bcrypt.compare(currentPassword, user.password);

  if (!matches) {
    return res.status(401).json({
      success: false,
      message: "Incorrect current password.",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashedPassword },
  });

  return res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
}

export async function deleteAccount(req, res) {
  try {
    await prisma.user.delete({
      where: {
        id: req.userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account.",
    });
  }
}


