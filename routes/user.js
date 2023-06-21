const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { getUserProfile, getAppliedJobs, getPublishedJobs, updatePassword, updateUser, deleteUser, getUsers, deleteUserAdmin } = require("../controllers/userController");

const router = express.Router();
router.use(isAuthenticatedUser);
router.route("/me").get(isAuthenticatedUser, getUserProfile);

router.route("/jobs/applied").get(authorizeRoles("user"), getAppliedJobs);
router.route("/jobs/published").get(authorizeRoles("employeer", "admin"), getPublishedJobs);

router.route("/password/update").put(updatePassword);
router.route("/me/update").put(updateUser);

router.route("/me/delete").delete(deleteUser);

// Admin only routes
router.route("/users").get(authorizeRoles("admin"), getUsers);
router.route("/user/:id").delete(authorizeRoles("admin"), deleteUserAdmin);

module.exports = router;
