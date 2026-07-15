const router = require("express").Router();
const controller = require("../controllers/users.controller");
const { allowRoles } = require("../middleware/auth");

router.get("/", allowRoles("super_admin"), controller.list);
router.post("/", allowRoles("super_admin"), controller.create);
router.patch("/:id", allowRoles("super_admin"), controller.update);
router.delete("/:id", allowRoles("super_admin"), controller.delete);

module.exports = router;
