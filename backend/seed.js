/**
 * This creates the necessary tables if they don't exist and inserts sample data for the
 * workshop and reservation tables.
 *
 * Usage:
 *   node backend/seed.js
 *
 * Make sure to set the DATABASE_URL environment variable before running this script.
 */

require("dotenv").config();
const { Pool } = require("pg");

// Mask and log the DATABASE_URL (hide password) to help debugging
const maskedDatabaseUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
  : "<not set>";
console.log("Using DATABASE_URL:", maskedDatabaseUrl);

// If the connection string is a Supabase-hosted Postgres URL, enable SSL
const useSsl =
  process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase.co");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});

const workshops = [
  {
    title: "Woodworking: Build a Birdhouse",
    description:
      "A beginner-friendly class using basic hand tools and drills. Take home your own cedar birdhouse!",
    category: "Woodworking",
    facilitator: "Ron Swanson",
    total_seats: 12,
    seats_remaining: 12,
    date: "2026-09-01T10:00:00Z",
  },
  {
    title: "3D Printing 101: Print Your First Figurine",
    description:
      "Learn how to find models online, slice them, and use our beginner-friendly FDM 3D printers.",
    category: "3D Printing",
    facilitator: "Jane Doe",
    total_seats: 10,
    seats_remaining: 10,
    date: "2026-09-05T14:00:00Z",
  },
  {
    title: "DIY Electronics: Light-Up Greeting Cards",
    description:
      "A fun, safe introduction to circuits using copper tape, coin batteries, and tiny LEDs.",
    // EDGE CASE 1: Missing Data (Missing category and facilitator)
    total_seats: 15,
    seats_remaining: 15,
    date: "2026-09-10T09:00:00Z",
  },
  {
    title: "Sewing Basics: Make Your Own Tote Bag",
    description:
      "Learn how to thread a basic sewing machine and stitch together a sturdy canvas tote.",
    category: "Textiles",
    facilitator: "Alice Johnson",
    total_seats: 8,
    seats_remaining: 8,
    date: "2026-09-12T13:00:00Z",
  },
  {
    title: "Intro to Arduino: Smart Plant Monitor",
    description:
      "Wire up a soil moisture sensor to an Arduino so your houseplant can tell you when it needs water!",
    category: "Electronics",
    facilitator: "Bob Lee",
    total_seats: 12,
    // EDGE CASE 2: Visibly Full
    seats_remaining: 0,
    date: "2026-09-15T15:00:00Z",
  },
  {
    title: "Laser Engraving: Custom Wooden Coasters",
    description:
      "Bring your favorite quotes or simple drawings and learn how to engrave them onto blank coasters.",
    category: "Fabrication",
    facilitator: "Dan Smith",
    total_seats: 12,
    seats_remaining: 12,
    date: "2026-09-18T10:00:00Z",
  },
  {
    title: "Cricut Crafting: Custom Vinyl Stickers",
    description:
      "Learn how to design and cut your own custom decals for laptops, water bottles, and notebooks.",
    category: "Crafts",
    facilitator: "Diana Prince",
    total_seats: 20,
    seats_remaining: 20,
    date: "2026-09-20T09:00:00Z",
  },
  {
    title: "Upcycling: Refinish a Thrifted Side Table",
    description:
      "Bring a small piece of old furniture! We will cover sanding, staining, and sealing.",
    category: "Woodworking",
    facilitator: "Charlie Davis",
    total_seats: 6,
    seats_remaining: 6,
    date: "2026-09-22T14:00:00Z",
  },
];

// Function to create the database schema if it doesn't exist yet.
async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workshops (
      id SERIAL PRIMARY KEY,
      description TEXT,
      title TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      total_seats INTEGER NOT NULL,
      seats_remaining INTEGER NOT NULL,
      category TEXT,
      facilitator TEXT
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      workshop_id INTEGER REFERENCES workshops(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(workshop_id, email) -- Ensure a user can only reserve once per workshop
    );
  `);
}

// Function to seed the database with sample data if it's empty.
async function seedData() {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS cnt FROM workshops",
  );
  if (rows[0].cnt === 0) {
    console.log("Seeding workshops...");

    for (const w of workshops) {
      // normalize fields so older/alternate keys still work
      const title = w.title;
      const description = w.description || null;
      const date = w.date || w.starts_at || null;
      const total_seats = w.total_seats || w.capacity || 0;
      const seats_remaining =
        typeof w.seats_remaining === "number" ? w.seats_remaining : total_seats;
      const category = w.category || null;
      const facilitator = w.facilitator || null;

      await pool.query(
        "INSERT INTO workshops (title, description, date, total_seats, seats_remaining, category, facilitator) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          title,
          description,
          date,
          total_seats,
          seats_remaining,
          category,
          facilitator,
        ],
      );
    }
  } else {
    console.log("Workshops already present, skipping workshop seed.");
  }
}

async function main() {
  try {
    console.log("Schema initialization and Data seeding...");
    await createSchema();
    await seedData();
    console.log("Compelete.");
  } catch (err) {
    console.error("Failed: ", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
