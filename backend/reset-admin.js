require("dotenv").config();

const { resetSuperAdmin } = require("./src/services/userSetup");

resetSuperAdmin()
  .then(() => {
    console.log("Super admin reset successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });