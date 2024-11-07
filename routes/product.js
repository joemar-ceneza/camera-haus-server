const express = require("express");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/product");
const { uploadProductImage } = require("../middleware/multer");

const router = express.Router();

// create new product with image upload
router.post("/", uploadProductImage.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      regularPrice,
      isNewProduct,
      quantity,
      category,
    } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;
    const newProduct = new Product({
      image: imageUrl,
      title,
      description,
      regularPrice,
      isNewProduct,
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
      } catch (error) {
        console.error("Error deleting image from Cloudinary: ", error);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

// get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// router to get products based on query parameters
router.get("/products", async (req, res) => {
  try {
    const { isNewProduct, slug } = req.query;
    const filter = {};
    if (isNewProduct) {
      filter.isNewProduct = isNewProduct === "true";
    }
    if (slug) {
      const product = await Product.findOne({ slug }).populate("category");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json([
        {
          ...product.toObject(),
        },
      ]);
    }
    const products = await Product.find(filter).populate("category");
    const productsWithCategory = products.map((product) => ({
      ...product.toObject(),
    }));
    res.json(productsWithCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update a product by id with image upload
router.put("/:id", uploadProductImage.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      regularPrice,
      isNewProduct,
      quantity,
      category,
    } = req.body;

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
    if (typeof isNewProduct !== "undefined")
      product.isNewProduct = isNewProduct === "true";
    if (quantity) product.quantity = quantity;
    if (category) product.category = category;

    if (imageUrl) {
      if (product.image) {
        const publicId = product.image
          .split("/")
          .slice(-4)
          .join("/")
          .split(".")[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary", error);
          return res
            .status(500)
            .json({ error: "Failed to delete old image from Cloudinary" });
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
      } catch (error) {
        console.error(
          "Error deleting new image from Cloudinary after update failed: ",
          error
        );
      }
    }
    console.error("Update product error:", error);
    res.status(400).json({ error: error.message });
  }
});

// delete a product by id with image upload
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) {
      const publicId = product.image
        .split("/")
        .slice(-4)
        .join("/")
        .split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary: ", error);
        return res
          .status(500)
          .json({ error: "Failed to delete image from Cloudinary" });
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product and associated image deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
