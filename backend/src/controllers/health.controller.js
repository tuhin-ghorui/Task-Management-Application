const env = require("../config/env");

const getHealth = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Task Management API is healthy",
      environment: env.nodeEnv
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};
