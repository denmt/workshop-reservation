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

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});

module.exports = app;
