import Database from "better-sqlite3";

const db = new Database("db.sqlite");

try {
  db.prepare(`
    ALTER TABLE tournaments ADD COLUMN room_id TEXT DEFAULT NULL
  `).run();

  console.log("✅ room_id added");
} catch (err) {
  console.log("⚠️ room_id:", err.message);
}

try {
  db.prepare(`
    ALTER TABLE tournaments ADD COLUMN room_pass TEXT DEFAULT NULL
  `).run();

  console.log("✅ room_pass added");
} catch (err) {
  console.log("⚠️ room_pass:", err.message);
}

db.close();