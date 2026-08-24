# Workshop Reservations - Assessment

This project is a system designed to manage workshop reservations for a community makerspace. It allows users to browse available workshops, view details, and reserve seats while ensuring that overbooking is impossible.

---

## Technology Stack

**Frontend:** Next.js (App Router), Tailwind CSS v4, React, `shadcn/ui`
**Backend:** Express.js (Node.js)
**Database:** Supabase (PostgreSQL)

---

## Setup & Run Instructions

This repository is set up as a monorepo containing both the frontend and backend. It takes exactly **two commands** to get the entire system running with seed data.

### Prerequisites

- Node.js (v18+)
- PostgreSQL database (Local or Cloud like Supabase/Neon)

### 1. Environment Setup

Create a `.env` file in the root directory (or inside the `backend` folder) with the Supabase connection string:

```env
DATABASE_URL="postgresql://postgres.[your-project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

### 2. Run the App

Install dependencies and start the app from the **root directory**:

```bash
npm install
npm run seed  # Creates tables and inserts 8 seed workshops (including full and missing-data edge cases)
npm run dev   # Starts both backend (port 4000) and frontend (port 3000) concurrently
```

The app will be available at `http://localhost:3000`.

---

## Overbooking Solution

** I guaranteed that overbooking is genuinely impossible in this system by implementing a **Pessimistic Row-Level Lock\*\* inside a database transaction.

Here's how it works:

1. The Express backend immediately opens a database transaction (`BEGIN`). It queries the specific workshop using `SELECT ... FOR UPDATE`. This crucial command tells PostgreSQL to place an exclusive write-lock on that specific row in the `workshops` table.

2. If multiple users try to reserve the very last seat at the exact same millisecond, they all hit the database simultaneously. However, PostgreSQL will grant the lock to the first requestand force the other 99 requests into a waiting queue.
3. The first request reads `seats_remaining = 1`, decrements the seat count to `0`, inserts the reservation, and commits the transaction (`COMMIT`), which releases the lock.
4. The database then lets the second request in line acquire the lock. However, it now reads the freshly updated row where `seats_remaining = 0`. The backend catches this, triggers a `ROLLBACK` to abort the transaction, and returns a safe `409 Conflict: No seats available` error to the frontend.

Additionally, I added a `UNIQUE(workshop_id, email)` constraint to the reservations table. This enforces a strict one-ticket-per-person rule, preventing automated bots from hoarding multiple seats under the same email.

---

## What I Cut

With a 6 to 8 hour budget, I focused relentlessly on the core requirements.

1. I cut user accounts/login. The prompt simply required "a name and an email" to reserve. Implementing JWTs or OAuth would consume hours of time better spent perfecting the concurrency locks. I prevented spam by using the unique database constraints instead.

2. The UI includes a functional "Proof of Payment" file dropzone that accepts image. However, actually uploading these was cut as it was out of scope for demonstrating the core CRUD and concurrency requirements.
3. I considered building a system where the seat is locked the moment the modal opens. I cut this because, without authentication, anonymous users could easily hoard seats by opening 20 tabs. The pessimistic lock on submission was the safer, more robust choice for this scope.

---

## AI Usage

AI tools (Agentic AI / LLMs) were utilized as a collaborative pair-programming partner during this assessment.

**What the AI did:**

- Generated the boilerplate scaffolding for Next.js and Express.
- Generated the mock SQL seed data (the 8 workshops, ensuring edge cases like missing facilitators and 0 seats were included).
- Assisted with troubleshooting on UI/UX.

**What I owned completely:**

- The Backend database schema design, including the `UNIQUE(workshop_id, email)` constraint and the `SELECT ... FOR UPDATE` transaction logic.
- The API design and implementation of the Express backend, including all routes, controllers, and error handling.
- The architectural decision to use `SELECT ... FOR UPDATE` (Pessimistic Locking) over Optimistic Concurrency Control, and writing the actual transaction logic.
- All scope management, UX state handling decisions, and the architectural design of the application.
