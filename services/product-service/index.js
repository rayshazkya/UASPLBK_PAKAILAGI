require("dotenv").config({ path: "../../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");
const Product = require("./Product");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/product-images", express.static("product-images"));

if (!fs.existsSync("product-images")) fs.mkdirSync("product-images");

const storage = multer.diskStorage({
  destination: "product-images/",
  filename: (req, file, cb) =>
    cb(
      null,
      `prod_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`,
    ),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
      if (!req.user.has_store)
        return res.status(403).json({ message: "Kamu belum punya toko" });
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
      if (!name || !category || !size || !grade || !price)
        return res.status(400).json({ message: "Field wajib tidak lengkap" });

      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map((f) => `/product-images/${f.filename}`);
      }
      if (req.body.image_url) images.push(req.body.image_url);

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

      // Update total_products di store
      try {
        const count = await Product.countDocuments({ owner_id: req.user.id });
        await axios.patch(
          `http://localhost:3005/stores/owner/${req.user.id}/stats`,
          { total_products: count },
        );
      } catch (e) {
        console.error(e.message);
      }

      res.status(201).json({ ...product.toObject(), id: product._id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
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
        product.images = req.files.map((f) => `/product-images/${f.filename}`);
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
