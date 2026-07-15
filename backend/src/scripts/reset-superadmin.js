require("dotenv").config();
const { resetSuperAdmin } = require("../services/userSetup");
const pool = require("../config/db");

resetSuperAdmin().then((created) => {
  console.log(created ? "Super Admin created successfully." : "Super Admin credentials updated successfully.");
}).catch((error) => {
  console.error(`Reset failed: ${error.message}`);
  process.exitCode = 1;
}).finally(() => pool.end());
