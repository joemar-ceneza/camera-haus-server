const express = require("express");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/product");
const { uploadProductImage } = require("../middleware/multer");

const router = express.Router();

// create new product with image upload
router.post("/", uploadProductImage.single("image"), async (req, res) => {
  try {
    const { title } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;
    const newProduct = new Product({
      title,
      image: imageUrl,
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

module.exports = router;
