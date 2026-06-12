require("dotenv").config({ path: "../../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");
const axios = require("axios");
const Product = require("./Product");

const app = express();
app.use(cors());
app.use(express.json());
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fashion-rescue",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || "fashionrescue_jwt_secret_2024";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Product service connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB error:", err));

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid" });
  }
};

// GET semua produk tersedia (public)
app.get("/products", async (req, res) => {
  try {
    const { category, size, grade, search, store_id } = req.query;
    const filter = { status: "available" };
    if (category) filter.category = category;
    if (size) filter.size = size;
    if (grade) filter.grade = grade;
    if (store_id) filter.store_id = store_id;
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    const products = await Product.find(filter).sort("-createdAt");
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET produk by toko (public - semua status)
app.get("/products/store/:storeId", async (req, res) => {
  try {
    const products = await Product.find({ store_id: req.params.storeId }).sort(
      "-createdAt",
    );
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET satu produk (public)
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ ...product.toObject(), id: product._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET produk milik penjual (seller)
app.get("/seller/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ owner_id: req.user.id }).sort(
      "-createdAt",
    );
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST tambah produk (seller)
app.post(
  "/products",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {

      const {
        name,
        category,
        size,
        grade,
        price,
        description,
        store_id,
        store_name,
      } = req.body;

      if (!store_id) {
        return res.status(400).json({
          message: "Toko tidak ditemukan"
        });
      }

      if (!name || !category || !size || !grade || !price) {
        return res.status(400).json({
          message: "Field wajib tidak lengkap"
        });
      }

      let images = [];

      if (req.files?.length > 0) {
        images = req.files.map(
          (f) => f.path
        );
      }

      if (req.body.image_url) {
        images.push(req.body.image_url);
      }

      const product = await Product.create({
        name,
        category,
        size,
        grade,
        price: parseFloat(price),
        description: description || "",
        images,
        store_id,
        store_name,
        owner_id: req.user.id,
        owner_name: req.user.name,
      });

      try {
        const count = await Product.countDocuments({
          owner_id: req.user.id,
        });

        await axios.patch(
          `http://localhost:3005/stores/owner/${req.user.id}/stats`,
          {
            total_products: count,
          }
        );
      } catch (e) {
        console.error(e.message);
      }

      res.status(201).json({
        ...product.toObject(),
        id: product._id,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// PUT update produk (seller)
app.put(
  "/products/:id",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        owner_id: req.user.id,
      });
      if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan" });

      const { name, category, size, grade, price, description, status } =
        req.body;
      if (name) product.name = name;
      if (category) product.category = category;
      if (size) product.size = size;
      if (grade) product.grade = grade;
      if (price) product.price = parseFloat(price);
      if (description !== undefined) product.description = description;
      if (status) product.status = status;
      if (req.files && req.files.length > 0) {
        product.images = req.files.map((f) => f.path);
      }
      if (req.body.image_url) product.images = [req.body.image_url];

      await product.save();
      res.json({ ...product.toObject(), id: product._id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// PATCH toggle status
app.patch("/products/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.id },
      { status },
      { new: true },
    );
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ message: "Status diperbarui", status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE produk
app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      owner_id: req.user.id,
    });
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    try {
      const count = await Product.countDocuments({ owner_id: req.user.id });
      await axios.patch(
        `http://localhost:3005/stores/owner/${req.user.id}/stats`,
        { total_products: count },
      );
    } catch (e) {
      console.error(e.message);
    }
    res.json({ message: "Produk dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: semua produk
app.get("/admin/products", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const products = await Product.find().sort("-createdAt");
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", service: "product" }));
app.listen(3002, () => console.log("Product service: http://localhost:3002"));
