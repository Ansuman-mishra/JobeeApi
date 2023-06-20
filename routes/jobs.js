const express = require("express");

const { getJobs, newJob, getJobsInRadius, updateJob, deleteJob, getJob, jobStats } = require("../controllers/jobsController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.route("/jobs").get(isAuthenticatedUser, getJobs);
router.route("/jobs/:id/:slug").get(isAuthenticatedUser, getJob);
router.route("/job/:zipcode/:distance").get(isAuthenticatedUser, getJobsInRadius);
router.route("/stats/:topic").get(isAuthenticatedUser, jobStats);
router.route("/job/new").post(isAuthenticatedUser, authorizeRoles("employer", "admin"), newJob);
router.route("/job/:id").put(isAuthenticatedUser, authorizeRoles("employer", "admin"), updateJob).delete(isAuthenticatedUser, authorizeRoles("employer", "admin"), deleteJob);

module.exports = router;
