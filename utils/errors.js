// translate internal/database errors into safe, client-facing responses.
// never expose raw error messages (stack traces, driver internals) to clients.
function toClientError(error) {
  // duplicate key — e.g. a unique title/slug already exists
  if (error && error.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || "value";
    return { status: 409, message: `A record with that ${field} already exists` };
  }

  // mongoose schema validation — messages are defined by us, so safe to surface
  if (error && error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return { status: 400, message: message || "Invalid input" };
  }

  // malformed ObjectId and similar cast failures
  if (error && error.name === "CastError") {
    return { status: 400, message: "Invalid identifier" };
  }

  return { status: 500, message: "Internal server error" };
}

module.exports = { toClientError };
