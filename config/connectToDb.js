const mongoose = require("mongoose");

// connect to mongodb
async function connectToDb() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    // fail fast — don't run the API against a database it can't reach
    process.exit(1);
  }
}

module.exports = connectToDb;
