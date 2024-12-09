const express = require("express");
const Category = require("../models/category");

const router = express.Router();

// create new category
router.post("/", async (req, res) => {
  try {
    const { title, products } = req.body;
    const newCategory = new Category({
      title,
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

// get a single category by id
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// route to get products by category slug
router.get("/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).populate("products");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // include the category slug in the response
    res.json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products: category.products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// delete a category id
router.delete("/:id", async (req, res) => {
  try {
    // find the category id
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // delete the category
    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
