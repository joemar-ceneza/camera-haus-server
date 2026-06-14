const express = require("express");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/product");
const { uploadProductImage } = require("../middleware/multer");
const { requireAuth } = require("../middleware/auth");
const { toClientError } = require("../utils/errors");

const router = express.Router();

// escape user input before using it inside a $regex query (prevents regex injection / ReDoS)
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// create new product with image upload
router.post("/", requireAuth, uploadProductImage.single("image"), async (req, res) => {
  try {
    const { title, description, regularPrice, isNewProduct, quantity, category } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;
    const newProduct = new Product({
      image: imageUrl,
      title,
      description,
      regularPrice,
      // form fields arrive as strings — coerce to a real boolean ("false" !== true)
      isNewProduct: isNewProduct === "true",
      quantity,
      category,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {
        console.error("Error deleting image from Cloudinary: ", cleanupError);
      }
    }
    const { status, message } = toClientError(error);
    console.error("[POST /api/products]", error);
    res.status(status).json({ error: message });
  }
});

// get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("[GET /api/products]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// router to get products based on query parameters
router.get("/products", async (req, res) => {
  try {
    const { isNewProduct, slug, search } = req.query;
    const filter = {};

    if (isNewProduct) {
      filter.isNewProduct = isNewProduct === "true";
    }

    if (slug) {
      const product = await Product.findOne({ slug }).populate("category");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json([product.toObject()]);
    }

    if (search) {
      // case-insensitive search by title (input escaped to prevent regex injection)
      filter.title = { $regex: escapeRegex(search), $options: "i" };
    }

    const products = await Product.find(filter).populate("category");
    const productsWithCategory = products.map((product) => ({
      ...product.toObject(),
    }));

    res.json(productsWithCategory);
  } catch (error) {
    console.error("[GET /api/products/products]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// route to fetch related products by category
router.get("/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // fetch the product by slug
    const product = await Product.findOne({ slug }).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // fetch related products based on the category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    });

    // respond with product details and related products
    res.json({ product, relatedProducts });
  } catch (error) {
    console.error("[GET /api/products/products/:slug]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// update a product by id with image upload
router.put("/:id", requireAuth, uploadProductImage.single("image"), async (req, res) => {
  try {
    const { title, description, regularPrice, isNewProduct, quantity, category } = req.body;

    const imageUrl = req.file ? req.file.path : undefined;

    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (title) {
      product.title = title;
      product.slug = title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }

    if (description) product.description = description;
    if (regularPrice) product.regularPrice = regularPrice;
    if (typeof isNewProduct !== "undefined") product.isNewProduct = isNewProduct === "true";
    if (quantity) product.quantity = quantity;
    if (category) product.category = category;

    if (imageUrl) {
      if (product.image) {
        const publicId = product.image.split("/").slice(-4).join("/").split(".")[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary", error);
          return res.status(500).json({ error: "Failed to delete old image from Cloudinary" });
        }
      }
      product.image = imageUrl;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {
        console.error("Error deleting new image from Cloudinary after update failed: ", cleanupError);
      }
    }
    const { status, message } = toClientError(error);
    console.error("[PUT /api/products/:id]", error);
    res.status(status).json({ error: message });
  }
});

// delete a product by id with image upload
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) {
      const publicId = product.image.split("/").slice(-4).join("/").split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary: ", error);
        return res.status(500).json({ error: "Failed to delete image from Cloudinary" });
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product and associated image deleted" });
  } catch (error) {
    console.error("[DELETE /api/products/:id]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
