require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// Masked DATABASE_URL for logs
const maskedDatabaseUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
  : "<not set>";
console.log("Using DATABASE_URL:", maskedDatabaseUrl);

const useSsl =
  process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase.co");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});

const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /api/workshops
 * Returns a list of all workshops, ordered by date (earliest first).
 */

app.get("/api/workshops", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date AS starts_at, total_seats, seats_remaining, category, facilitator
       FROM workshops
       ORDER BY date ASC NULLS LAST`,
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching workshops", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/workshops/:id
 * Returns a single workshop by its ID.
 * Usage: For searching a specific workshop, provide the ID in the URL path.
 */
app.get("/api/workshops/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date AS starts_at, total_seats, seats_remaining, category, facilitator
       FROM workshops WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching workshop", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/reservations
 * Body: { workshop_id, name, email }
 * Creates a reservation if seats are available and the same email hasn't reserved this workshop.
 */
app.post("/api/reservations", async (req, res) => {
  const { workshop_id, name, email } = req.body || {};
  if (!workshop_id || !name || !email)
    return res
      .status(400)
      .json({ error: "workshop_id, name, and email are required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the workshop row to prevent race conditions.
    const wk = await client.query(
      "SELECT id, seats_remaining FROM workshops WHERE id = $1 FOR UPDATE",
      [workshop_id],
    );
    if (wk.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Workshop not found" });
    }
    const seats_remaining = wk.rows[0].seats_remaining;
    if (seats_remaining <= 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "No seats available" });
    }

    // attempt to insert reservation (unique constraint on workshop_id+email)
    try {
      const insert = await client.query(
        "INSERT INTO reservations (workshop_id, name, email) VALUES ($1, $2, $3) RETURNING id, workshop_id, name, email, created_at",
        [workshop_id, name, email],
      );

      // decrement seats
      await client.query(
        "UPDATE workshops SET seats_remaining = seats_remaining - 1 WHERE id = $1",
        [workshop_id],
      );

      await client.query("COMMIT");
      return res.status(201).json(insert.rows[0]);
    } catch (insertErr) {
      await client.query("ROLLBACK");

      // Catch duplicate reservation errors.
      if (insertErr && insertErr.code === "23505") {
        return res
          .status(409)
          .json({ error: "Reservation already exists for this email" });
      }
      console.error("Reservation insert failed", insertErr);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("Reservation transaction failed", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/**
 * POST /api/reservations/cancel
 * Body options:
 * - { reservation_id }
 * - { workshop_id, email }
 * Cancels an existing reservation and increments seats_remaining.
 */

app.post("/api/reservations/cancel", async (req, res) => {
  const { reservation_id, workshop_id, email } = req.body || {};
  if (!reservation_id && !(workshop_id && email))
    return res
      .status(400)
      .json({ error: "reservation_id OR workshop_id+email required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let find;
    if (reservation_id) {
      find = await client.query(
        "SELECT id, workshop_id FROM reservations WHERE id = $1 FOR UPDATE",
        [reservation_id],
      );
    } else {
      find = await client.query(
        "SELECT id, workshop_id FROM reservations WHERE workshop_id = $1 AND email = $2 FOR UPDATE",
        [workshop_id, email],
      );
    }

    if (find.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reservation not found" });
    }

    const resv = find.rows[0];
    await client.query("DELETE FROM reservations WHERE id = $1", [resv.id]);
    await client.query(
      "UPDATE workshops SET seats_remaining = seats_remaining + 1 WHERE id = $1",
      [resv.workshop_id],
    );

    await client.query("COMMIT");
    return res.json({ cancelled: true, reservation_id: resv.id });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("Cancel reservation failed", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});

module.exports = app;
