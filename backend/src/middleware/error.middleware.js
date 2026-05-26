const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const handleDuplicateFields = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || "field";
  return new AppError(`An account with that ${field} already exists`, 409);
};

const handleValidationError = (error) => {
  const messages = Object.values(error.errors).map((value) => value.message);
  return new AppError(messages.join(". "), 400);
};

const handleCastError = (error) => {
  return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
};

const errorHandler = (error, req, res, next) => {
  let normalizedError = error;

  if (error.code === 11000) {
    normalizedError = handleDuplicateFields(error);
  }

  if (error.name === "ValidationError") {
    normalizedError = handleValidationError(error);
  }

  if (error.name === "CastError") {
    normalizedError = handleCastError(error);
  }

  const statusCode = normalizedError.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    status: normalizedError.status || "error",
    message: normalizedError.isOperational ? normalizedError.message : "Something went wrong",
    stack: process.env.NODE_ENV === "development" ? normalizedError.stack : undefined
  });
};

module.exports = {
  notFound,
  errorHandler
};
