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

// update a product by id with image upload
router.put(
  "/:id",
  uploadProductImage.single("image", async (req, res) => {
    try {
      const { title } = req.body;
      const imageUrl = req.file ? req.file.path : undefined;

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
      }
      const updateProduct = await product.save();
      res.json(updateProduct);
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
      res.status(400).json({ error: error.message });
    }
  })
);

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
