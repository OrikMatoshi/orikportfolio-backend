
const Database = require("better-sqlite3");
const path = require("path");

// Connect to database
const db = new Database(
  path.join(__dirname, "portfolio.db")
);

// Create contact messages table
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

console.log("Portfolio database connected successfully!");

module.exports = db;
