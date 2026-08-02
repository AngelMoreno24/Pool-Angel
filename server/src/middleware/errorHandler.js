export const createError = (message, statusCode = 500, details) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details !== undefined) {
    error.details = details;
  }

  return error;
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const response = {
    error: message,
  };

  if (process.env.NODE_ENV !== "production" && err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
