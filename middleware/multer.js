const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// configuration for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-commerce/camera-haus/products",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const uploadProductImage = multer({ storage: productStorage });

module.exports = { uploadProductImage };
