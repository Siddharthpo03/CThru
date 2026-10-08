import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(email, resetLink) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "⚠️ Warning: EMAIL_USER / EMAIL_PASS not configured. Password reset link:",
      resetLink,
    );
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    await transporter.sendMail({
      from: `"CThru" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your CThru Password",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>Password Reset Request</h2>

          <p>We received a request to reset your password.</p>

          <p>
            Click the button below to create a new password.
          </p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              background:#2563eb;
              color:white;
              padding:12px 20px;
              text-decoration:none;
              border-radius:8px;
              margin:20px 0;
            "
          >
            Reset Password
          </a>

          <p>This link expires in <b>15 minutes</b>.</p>

          <p>If you didn't request this, you can safely ignore this email.</p>

          <hr/>

          <small>CThru Code Review Platform</small>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

