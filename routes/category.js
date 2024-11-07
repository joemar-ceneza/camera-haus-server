const express = require("express");
const Category = require("../models/category");

const router = express.Router();

// create new category
router.post("/", async (req, res) => {
  try {
    const { name, products } = req.body;
    const newCategory = new Category({
      name,
      products,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
