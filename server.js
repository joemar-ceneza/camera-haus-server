// load environment variables from the .env file
require("dotenv").config();

// import dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectToDb = require("./config/connectToDb");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5000;

// security headers — allow cross-origin use since this API is consumed by a separate frontend
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// restrict CORS to the configured client origin(s); CLIENT_URL may be comma-separated
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn("[cors] CLIENT_URL is not set — allowing all origins (development only)");
}

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

// basic abuse protection across the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api", apiLimiter);

app.use(express.json({ limit: "1mb" }));

// connect to database
connectToDb();

// health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// unmatched routes + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
