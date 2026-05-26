const express = require("express");

const {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  toggleTaskCompletion,
  updateTask
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).patch(updateTask).delete(deleteTask);
router.patch("/:id/toggle-complete", toggleTaskCompletion);

module.exports = router;
