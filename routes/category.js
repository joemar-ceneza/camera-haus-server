const express = require("express");
const Category = require("../models/category");
const { requireAuth } = require("../middleware/auth");
const { toClientError } = require("../utils/errors");

const router = express.Router();

// create new category
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, products } = req.body;
    const newCategory = new Category({
      title,
      products,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    const { status, message } = toClientError(error);
    console.error("[POST /api/categories]", error);
    res.status(status).json({ error: message });
  }
});

// get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get a single category by id
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("[GET /api/categories/:id]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// route to get products by category slug
router.get("/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).populate("products");

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // include the category slug in the response
    res.json({
      category: {
        id: category._id,
        name: category.title,
        slug: category.slug,
      },
      products: category.products,
    });
  } catch (error) {
    console.error("[GET /api/categories/categories/:slug]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// delete a category id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // find the category id
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // delete the category
    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("[DELETE /api/categories/:id]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
