import nodemailer from "nodemailer";

function buildEmailHtml(resetLink) {
  return `
    <div style="font-family:Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <h2 style="color:#09090b;margin-bottom:12px;">Reset Your CThru Password</h2>
      <p style="color:#52525b;font-size:14px;line-height:22px;">
        We received a request to reset your password. Click the button below to choose a new password.
      </p>
      <div style="margin:28px 0;text-align:center;">
        <a
          href="${resetLink}"
          style="
            display:inline-block;
            background:#4f46e5;
            color:#ffffff;
            padding:12px 24px;
            font-size:14px;
            font-weight:600;
            text-decoration:none;
            border-radius:8px;
          "
        >
          Reset Password
        </a>
      </div>
      <p style="color:#71717a;font-size:12px;line-height:18px;">
        This link expires in <b>15 minutes</b>. If you did not request this, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0;" />
      <small style="color:#a1a1aa;font-size:11px;">CThru Code Review Platform</small>
    </div>
  `;
}

// 1. Send via Resend HTTP REST API (Port 443 - Works on Render Free Tier)
async function sendViaResend(email, resetLink) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "CThru <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your CThru Password",
      html: buildEmailHtml(resetLink),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }

  console.log(`✅ [EMAIL:RESEND] Password reset email dispatched to ${email}. Id: ${data.id}`);
  return true;
}

// 2. Send via Brevo HTTP REST API (Port 443 - Works on Render Free Tier)
async function sendViaBrevo(email, resetLink) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey.trim(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "CThru",
        email: process.env.EMAIL_USER || "support@c-thru.app",
      },
      to: [{ email }],
      subject: "Reset Your CThru Password",
      htmlContent: buildEmailHtml(resetLink),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }

  console.log(`✅ [EMAIL:BREVO] Password reset email dispatched to ${email}. MessageId: ${data.messageId}`);
  return true;
}

// 3. Send via SMTP (Works locally or on servers without outbound port blocks)
async function sendViaSmtp(email, resetLink) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return false;
  }

  const cleanPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: cleanPass,
    },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 6000,
  });

  const info = await transporter.sendMail({
    from: `"CThru" <${process.env.EMAIL_USER.trim()}>`,
    to: email,
    subject: "Reset Your CThru Password",
    html: buildEmailHtml(resetLink),
  });

  console.log(`✅ [EMAIL:SMTP] Password reset email dispatched to ${email}. MessageId: ${info.messageId}`);
  return true;
}

export async function sendPasswordResetEmail(email, resetLink) {
  try {
    // Priority 1: Resend HTTP API (Unblocked on Render Free Tier)
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(email, resetLink);
    }

    // Priority 2: Brevo HTTP API (Unblocked on Render Free Tier)
    if (process.env.BREVO_API_KEY) {
      return await sendViaBrevo(email, resetLink);
    }

    // Priority 3: Direct SMTP (Gmail)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return await sendViaSmtp(email, resetLink);
    }

    console.warn(
      `⚠️ [EMAIL] No email provider configured. Password reset link: ${resetLink}`
    );
  } catch (error) {
    console.error("❌ [EMAIL] Delivery failed:", error.message || error);

    // If SMTP failed with ETIMEDOUT (common on Render free tier)
    if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
      console.warn(
        `⚠️ [RENDER NOTICE] Render Free Tier blocks outbound SMTP ports (465/587). To send emails directly from Render, add RESEND_API_KEY (free at resend.com) to your Render Environment Variables.`
      );
    }
  }
}
