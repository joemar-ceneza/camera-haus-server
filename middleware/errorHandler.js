const { toClientError } = require("../utils/errors");

// 404 for any unmatched route
function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

// catch-all error handler — logs full detail, returns a safe message
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  console.error("[unhandled]", error);
  const { status, message } = toClientError(error);
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
