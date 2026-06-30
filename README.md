# Nestly SaaS Platform

Nestly is an enterprise-grade, multi-tenant condominium community SaaS platform. It enables residents and sellers to connect, chat, run errands, and exchange listings within their specific condominium building context under strict data-isolation boundaries.

---

## 🚀 Features

*   **Multi-Tenant Isolation**: Rigorous data separation at the database and API query layer using Condominium Context boundaries (`X-Condo-ID` header validation).
*   **Secure Authentication**:
    *   Passwords salted and encrypted using **Argon2id** (OWASP-recommended).
    *   Access and Refresh token rotation model (HTTP-only secure same-site cookies).
    *   **Email Verification Gating**: Restricts unverified logins until verified via secure email links.
    *   **Secure Password Reset**: Multi-step token validation with automatic revocation of all active sessions upon password modification.
*   **Real-time Communication**: Chat channels powered by Socket.io, isolated per conversation ID.
*   **Security & Hardening**:
    *   Express request rate limiting (`express-rate-limit`) on all authentication routes.
    *   **Helmet** integration for HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
    *   Express payload size limits (10kb maximum) on incoming request bodies to prevent DoS.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, Socket.io
*   **Database**: PostgreSQL with Prisma ORM
*   **Frontend**: React, Vite, React Router DOM, AppContext state management
*   **Styling**: Vanilla CSS with premium glassmorphism and modern dark-mode aesthetics.

---

## 📁 Directory Structure

```
nestly/
├── backend/            # Express APIs, Socket.io, Prisma schema, and services
│   ├── config/         # Database configurations
│   ├── controllers/    # Authentication, Admin, and Chat controllers
│   ├── middleware/     # Tenancy, rate limiters, and JWT middleware
│   ├── prisma/         # Schema, migrations, and seed scripts
│   ├── routes/         # API routing definitions
│   └── services/       # Email mock and notification service
└── frontend/           # React single page application (Vite-bundler)
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── contexts/   # Application-wide global contexts
    │   ├── pages/      # Views (Login, VerifyEmail, Dashboards, etc.)
    │   └── services/   # Client API client helper
    └── index.html
```

---

## ⚙️ Setup & Installation

### Prerequisite
Ensure you have **Node.js** (v18+) and a running **PostgreSQL** instance.

### 1. Database Configuration
In `backend/.env`, configure your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nestly?schema=public"
JWT_SECRET="your_secure_nestly_jwt_secret_key"
PORT=5001
```

### 2. Setup the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Sync the Prisma schema:
   ```bash
   npx prisma db push
   ```
4. Seed the database with condominiums and initial accounts:
   ```bash
   npm run seed
   ```
5. Start the API server:
   ```bash
   npm start
   ```

### 3. Setup the Frontend
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development Vite server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5175` in your browser.

---

## 🧪 Security & Verification Testing

To run the automated integration tests verifying the security flows, run the following commands inside the `backend/` directory:

*   **Tenancy Isolation Verification**:
    ```bash
    node test_tenancy.js
    ```
*   **Auth & Password Hashing Verification**:
    ```bash
    $env:NODE_ENV="test"; node test_security_flows.js
    ```
