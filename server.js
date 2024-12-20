// load environment variables from the .env file
require("dotenv").config();

// import dependencies
const express = require("express");
const cors = require("cors");
const connectToDb = require("./config/connectToDb");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect to database
connectToDb();

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
