import Database from "better-sqlite3";
import path from "path/win32";


const dbPath = path.join(process.cwd(), "db.sqlite");
const db = new Database(dbPath);

/* =========================
   USERS
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referral_count INTEGER DEFAULT 0,
    referred_by TEXT,
    total_points INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   TOURNAMENTS
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    game TEXT, -- BGMI / PUBG_PC
    mode TEXT, -- solo / duo / squad / tdm
    map TEXT,
    entry_fee INTEGER,
    prize_pool INTEGER,
    total_slots INTEGER,
    filled_slots INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming', -- open / full / closed
    room_id TEXT DEFAULT NULL,
    room_pass TEXT DEFAULT NULL,
    start_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   REGISTRATIONS (JOIN MATCH)
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tournament_id INTEGER,
    team_name TEXT,
    team_tag TEXT,
    captain_name TEXT,
    captain_player_id TEXT,
    status TEXT DEFAULT 'pending', -- pending / approved / rejected
    payment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   PLAYERS (TEAM MEMBERS)
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER,
    player_name TEXT,
    player_id TEXT,
    is_captain INTEGER DEFAULT 0
  )
`).run();

/* =========================
   PAYMENTS
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tournament_id INTEGER,
    amount INTEGER,
    method TEXT, -- UPI / Razorpay
    transaction_id TEXT,
    screenshot_url TEXT,
    status TEXT DEFAULT 'pending', -- pending / verified / rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   POINTS LEDGER
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    points INTEGER, -- + or -
    type TEXT, -- match_win / referral / redeem
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   REDEEMS
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS redeems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    points_used INTEGER,
    amount INTEGER,
    upi_id TEXT,
    status TEXT DEFAULT 'pending', -- pending / approved / rejected / paid
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   REFERRALS
========================= */
db.prepare(`
  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER,
    referred_user_id INTEGER,
    points_given INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/* =========================
   INDEXES (IMPORTANT)
========================= */
db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();


const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all();

console.log(tables);

export { db };  