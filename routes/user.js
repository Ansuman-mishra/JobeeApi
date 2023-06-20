const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const { getUserProfile } = require("../controllers/userController");

const router = express.Router();
router.route("/me").get(isAuthenticatedUser, getUserProfile);
module.exports = router;
