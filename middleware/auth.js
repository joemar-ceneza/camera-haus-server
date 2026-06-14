const crypto = require("crypto");

// timing-safe string comparison to avoid leaking the token via response timing
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// guards mutating routes — expects "Authorization: Bearer <API_TOKEN>"
function requireAuth(req, res, next) {
  const expected = process.env.API_TOKEN;
  // fail closed: never allow mutations if the server has no token configured
  if (!expected) {
    console.error("[auth] API_TOKEN is not set — refusing mutating request");
    return res.status(500).json({ error: "Server authentication is not configured" });
  }

  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!safeEqual(token, expected)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = { requireAuth };
