# 🔍 CThru — AI-Powered Code Review & Automated Refactoring Assistant

**CThru** is a full-stack, enterprise-grade AI Code Review platform that empowers developers to analyze source code for **Security Vulnerabilities**, **Code Quality Smells**, and **Complexity Hotspots**. 

By combining a **deterministic static analysis engine** with **Google Gemini LLM intelligence**, CThru provides verified code inspections, hallucination filtering, health scores (0–100), interactive dashboard statistics, and **one-click automated AI code refactoring**.

---

## 🌟 Key Features

- ⚡ **Dual-Engine Code Review**: Combines local static analysis with Google Gemini LLM for maximum speed and depth.
- 🛡️ **Multi-Category Inspections**: Select specific audit categories: **Security**, **Code Quality**, and **Complexity**.
- 🛡️ **AI Hallucination Verification**: Filters out non-existent line numbers or false AI findings against actual source code lines.
- 🪄 **One-Click Automated AI Fixes**: Refactors and auto-corrects flagged issues with code diffs and explanations.
- 📊 **Interactive Analytics Dashboard**: Tracks overall scores, pass rates ($\ge 80\%$), security warning trends, and review history.
- 🔒 **Secure User Authentication**: Full user login, signup, JWT authentication, and email-based password resets via Nodemailer.
- 📄 **Exportable Reports**: Generate structured review breakdowns and summaries.

---

## 🏗️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | High-performance Single Page Application (SPA) |
| **Styling & UI** | Vanilla CSS + Lucide Icons + React Hot Toast | Modern dark-mode responsive user interface |
| **Backend** | [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/) | RESTful API backend server |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) | Serverless database schema & query management |
| **AI Engine** | [Google GenAI SDK](https://ai.google.dev/) (`@google/genai`) | Gemini models (`gemini-3.1-flash-lite`, etc.) with strict JSON Schema |
| **Authentication**| JWT (`jsonwebtoken`) + `bcryptjs` | Secure session handling & token authorization |

---

## 📋 Prerequisites

Before running CThru on your computer, ensure you have the following installed:

1. **[Node.js](https://nodejs.org/)** (v18.0.0 or higher) — [Download Node.js](https://nodejs.org/)
2. **[npm](https://www.npmjs.com/)** (comes bundled with Node.js)
3. **[Git](https://git-scm.com/)** — [Download Git](https://git-scm.com/)
4. **PostgreSQL Database** — You can use a free cloud database like [Neon PostgreSQL](https://neon.tech/) or a local PostgreSQL instance.
5. **Google Gemini API Key** — Get a free API key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Quick Start Guide (Run on Your Computer)

Follow these step-by-step instructions to get CThru up and running locally in under **5 minutes**.

### Step 1: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/Siddharthpo03/CThru.git
cd CThru
```

---

### Step 2: Set Up & Start the Backend

1. **Navigate to the `backend` directory**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` folder by copying `.env.example`:
   ```bash
   # On Windows Command Prompt:
   copy .env.example .env

   # On macOS/Linux or PowerShell:
   cp .env.example .env
   ```

4. **Update `.env` values**:
   Open `backend/.env` in your text editor and fill in your credentials:
   ```env
   DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your_custom_super_secret_jwt_key_here"
   JWT_EXPIRES_IN="7d"
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   GEMINI_MODEL="gemini-3.1-flash-lite"
   PORT=5000
   CLIENT_URL="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"
   ```

5. **Generate Prisma Client & Run Database Migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

6. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   *The backend server will run at:* `http://localhost:5000` *(You will see: `Neon PostgreSQL connected successfully.` and `CThru API running on port 5000`)*.

---

### Step 3: Set Up & Start the Frontend

Open a **new terminal window** (keep the backend server running in the first terminal).

1. **Navigate to the `frontend` directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` folder by copying `.env.example`:
   ```bash
   # On Windows Command Prompt:
   copy .env.example .env

   # On macOS/Linux or PowerShell:
   cp .env.example .env
   ```

4. **Update `.env` values**:
   Ensure `frontend/.env` points to your local backend API:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend application will open at:* `http://localhost:5173`

---

## 💻 How to Use CThru

1. Open `http://localhost:5173` in your browser.
2. **Register a new account** (or log in).
3. Click on **New Review** (`/review`).
4. Paste any source code snippet (JavaScript, Python, C++, Java, etc.), choose a title and language, and select analysis categories (**Security**, **Code Quality**, **Complexity**).
5. Click **Submit for Review**.
6. View real-time review results:
   - Overall Health Score (0-100) & Category Breakdown
   - Filterable issue findings by line number, severity, and explanation
   - Metrics breakdown (LOC, physical lines, issue counts)
7. Click **Auto-Fix Code** to get instant AI-corrected code!

---

## 🔑 Environment Variables Reference

### Backend (`/backend/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | **Yes** | Secret key used to sign authentication tokens | `super_secret_jwt_string` |
| `JWT_EXPIRES_IN`| No | Expiration time for JWT tokens | `7d` |
| `GEMINI_API_KEY`| **Yes** | Google Gemini AI API key | `AIzaSy...` |
| `GEMINI_MODEL` | No | Primary Gemini model identifier | `gemini-3.1-flash-lite` |
| `PORT` | No | Express HTTP server port | `5000` |
| `CLIENT_URL` | No | Frontend URL for CORS permissions | `http://localhost:5173` |
| `EMAIL_USER` | No | Gmail address for password reset emails | `user@gmail.com` |
| `EMAIL_PASS` | No | Gmail App Password for SMTP | `abcd efgh ijkl mnop` |

### Frontend (`/frontend/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | Backend REST API root URL | `http://localhost:5000/api` |

---

## 🔌 API Endpoints Overview

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Create a new user account
- `POST /api/auth/login` — Authenticate user & return JWT token
- `POST /api/auth/forgot-password` — Send password reset email
- `POST /api/auth/reset-password/:token` — Reset password via token
- `GET  /api/auth/profile` — Fetch current user profile *(Requires Auth)*

### Review Routes (`/api/reviews`)
- `POST /api/reviews` — Submit source code for dual static + AI review *(Requires Auth)*
- `GET  /api/reviews` — Get all user reviews *(Requires Auth)*
- `GET  /api/reviews/:id` — Get single review details by ID *(Requires Auth)*
- `POST /api/reviews/:id/auto-correct` — Trigger AI code auto-correction *(Requires Auth)*
- `DELETE /api/reviews/:id` — Delete a review record *(Requires Auth)*
- `GET  /api/reviews/stats` — Get overall user dashboard statistics *(Requires Auth)*

---

## 📁 Repository Structure

```
CThru/
├── backend/
│   ├── controllers/         # Request handling logic (Auth & Reviews)
│   ├── middleware/          # JWT auth guards, Zod validators, Error handling
│   ├── prisma/              # Database schema definition (`schema.prisma`)
│   ├── routes/              # Express routing definitions
│   ├── schemas/             # Input data validation schemas (Zod)
│   ├── services/            # Static analysis, Gemini AI, Verifier, Scoring
│   ├── utils/               # Database & AI SDK initialization helpers
│   ├── app.js               # Express application configuration
│   └── server.js            # Node HTTP server entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React UI components
│   │   ├── contexts/        # Auth context provider & global user state
│   │   ├── pages/           # Page views (Dashboard, Reviews, Profile, Settings)
│   │   ├── services/        # Centralized HTTP request helper (`api.js`)
│   │   ├── App.jsx          # Router & Route declarations
│   │   └── main.jsx         # Application mounting entry point
│   ├── index.html           # HTML template
│   └── vite.config.js       # Vite build setup
├── .gitignore               # Git ignored patterns
└── README.md                # Project documentation
```

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

<details>
<summary><b>1. Error: "Neon PostgreSQL connected failed" or database connection error</b></summary>
<br />

- Check if your `DATABASE_URL` in `backend/.env` is correct.
- Ensure your database connection string includes `?sslmode=require`.
- Make sure you ran `npx prisma migrate dev` in the `backend` folder.
</details>

<details>
<summary><b>2. Error: "Gemini AI analysis failed"</b></summary>
<br />

- Verify that `GEMINI_API_KEY` in `backend/.env` is valid and active.
- Note: If Gemini API fails or runs out of quota, CThru gracefully falls back to static code analysis, ensuring you still receive review findings.
</details>

<details>
<summary><b>3. CORS error when calling backend from frontend</b></summary>
<br />

- Ensure `CLIENT_URL` in `backend/.env` is set to `http://localhost:5173`.
- Ensure `VITE_API_URL` in `frontend/.env` is set to `http://localhost:5000/api`.
</details>

---

## 👥 Author & License

Developed with ❤️ by **Siddharth**.

Distributed under the **ISC License**. Feel free to use, modify, and distribute this project.
