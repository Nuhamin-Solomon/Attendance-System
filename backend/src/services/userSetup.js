require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../config/db");

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(80) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'employee')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS employee_id INTEGER UNIQUE REFERENCES employees(id) ON DELETE SET NULL
  `);
}


async function setupSuperAdmin() {
  await ensureUsersTable();

  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;

  const exists = await pool.query(
    "SELECT id FROM users WHERE LOWER(username)=LOWER($1)",
    [username]
  );

  if (exists.rows.length > 0) {
    return false;
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1,$2,'super_admin')`,
    [username, hash]
  );

  return true;
}


async function resetSuperAdmin() {
  await ensureUsersTable();

  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;

  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `UPDATE users 
     SET password_hash=$1, is_active=TRUE
     WHERE username=$2`,
    [hash, username]
  );

  if (result.rowCount === 0) {
    await pool.query(
      `INSERT INTO users(username,password_hash,role)
       VALUES($1,$2,'super_admin')`,
      [username, hash]
    );
  }
}


module.exports = {
  ensureUsersTable,
  setupSuperAdmin,
  resetSuperAdmin
};