const AppError = require("../utils/AppError");
const Task = require("../models/Task");
const { getUserRoom } = require("../socket/socket");

const allowedUpdateFields = ["title", "description", "status", "priority", "dueDate"];
const validStatuses = ["pending", "in-progress", "completed"];

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const pickAllowedFields = (source) => {
  return allowedUpdateFields.reduce((picked, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      picked[field] = source[field];
    }

    return picked;
  }, {});
};

const applyCompletedAt = (updates) => {
  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    updates.completedAt = updates.status === "completed" ? new Date() : null;
  }

  return updates;
};

const emitTaskEvent = (req, eventName, payload) => {
  const io = req.app.get("io");

  if (!io) {
    return;
  }

  io.to(getUserRoom(req.user._id)).emit(eventName, payload);
};

const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const query = {
      user: req.user._id
    };

    if (req.query.status) {
      if (!validStatuses.includes(req.query.status)) {
        return next(new AppError("Invalid task status filter", 400));
      }

      query.status = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const [tasks, totalTasks] = await Promise.all([
      Task.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        page,
        limit,
        totalTasks,
        totalPages: Math.ceil(totalTasks / limit) || 1
      },
      tasks
    });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      user: req.user._id
    });

    emitTaskEvent(req, "task:created", { task });

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const updates = applyCompletedAt(pickAllowedFields(req.body));

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    emitTaskEvent(req, "task:updated", { task });

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

const toggleTaskCompletion = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    task.status = task.status === "completed" ? "pending" : "completed";
    await task.save();

    emitTaskEvent(req, "task:updated", { task });

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    emitTaskEvent(req, "task:deleted", {
      taskId: task._id
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask
};
