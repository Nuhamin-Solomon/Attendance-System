require("dotenv").config();
const { setupSuperAdmin } = require("../services/userSetup");
const pool = require("../config/db");

setupSuperAdmin().then((created) => {
  console.log(created ? "Super Admin created successfully." : "Super Admin already exists; no account was created.");
}).catch((error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
}).finally(() => pool.end());
