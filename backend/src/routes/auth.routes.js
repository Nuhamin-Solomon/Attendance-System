const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/login", controller.login);
router.get("/me", requireAuth, controller.me);
router.post("/change-password", requireAuth, controller.changePassword);

module.exports = router;
