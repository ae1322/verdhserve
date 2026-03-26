const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'verdaserve.db');
let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      vehicle_type TEXT DEFAULT 'bike',
      is_available INTEGER DEFAULT 1,
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      worker_id INTEGER DEFAULT NULL,
      paper_qty REAL NOT NULL,
      paper_type TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      vehicle_type TEXT DEFAULT '',
      address TEXT NOT NULL,
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    )
  `);

  // Seed default admin
  const adminCheck = db.exec("SELECT id FROM users WHERE role = 'admin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Admin', 'admin@verdaserve.com', hash, 'admin']);
  }

  // Seed demo workers
  const workerCheck = db.exec("SELECT COUNT(*) as c FROM workers");
  const workerCount = workerCheck[0].values[0][0];
  if (workerCount === 0) {
    const hash = bcrypt.hashSync('worker123', 10);
    const workers = [
      ['Ravi Kumar', 'ravi@verdaserve.com', hash, '9876543210', 'bike'],
      ['Priya Sharma', 'priya@verdaserve.com', hash, '9876543211', 'auto'],
      ['Amit Singh', 'amit@verdaserve.com', hash, '9876543212', 'van'],
      ['Deepak Patel', 'deepak@verdaserve.com', hash, '9876543213', 'truck'],
    ];
    for (const w of workers) {
      db.run("INSERT INTO workers (name, email, password, phone, vehicle_type) VALUES (?, ?, ?, ?, ?)", w);
    }
  }

  saveDB();
  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper functions that mimic better-sqlite3 API
function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    const row = {};
    cols.forEach((c, i) => row[c] = vals[i]);
    return row;
  }
  stmt.free();
  return null;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  const cols = stmt.getColumnNames();
  while (stmt.step()) {
    const vals = stmt.get();
    const row = {};
    cols.forEach((c, i) => row[c] = vals[i]);
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDB();
  // Get last insert ID
  const result = db.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: result[0]?.values[0]?.[0] || 0 };
}

module.exports = { initDB, getOne, getAll, runQuery, saveDB };
