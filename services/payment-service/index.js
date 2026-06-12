require("dotenv").config({ path: "../../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("./Order");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "fashionrescue_jwt_secret_2024";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Payment service connected to MongoDB"))
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

const getProduct = async (productId) => {
  try {
    const res = await axios.get(`http://localhost:3002/products/${productId}`);
    return res.data;
  } catch {
    return null;
  }
};

const VA_MAP = {
  bca: "1234567890",
  bni: "9876543210",
  bri: "1122334455",
  mandiri: "5566778899",
};

// Checkout - buat pesanan baru
app.post("/payments/checkout", authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_notes,
      payment_method,
      bank_name,
    } = req.body;

    if (!product_id)
      return res.status(400).json({ message: "product_id wajib diisi" });
    if (
      !shipping_name ||
      !shipping_phone ||
      !shipping_address ||
      !shipping_city
    )
      return res.status(400).json({ message: "Data pengiriman tidak lengkap" });

    const ALLOWED_PAYMENT = ["transfer", "cod"];
    if (!payment_method || !ALLOWED_PAYMENT.includes(payment_method))
      return res.status(400).json({ message: "Metode pembayaran tidak valid" });
    if (payment_method === "transfer" && !bank_name)
      return res.status(400).json({ message: "Pilih bank tujuan transfer" });

    const product = await getProduct(product_id);
    if (!product || product.status !== "available")
      return res.status(404).json({ message: "Produk tidak tersedia" });

    const orderId = `FR-${Date.now()}-${String(req.user.id).slice(-4)}`;
    const amount = Math.round(parseFloat(product.price));

    let virtual_account = "";
    if (payment_method === "transfer" && bank_name) {
      virtual_account = VA_MAP[bank_name.toLowerCase()] || "0000000000";
    }

    const order = await Order.create({
      buyer_id: String(req.user.id),
      buyer_name: req.user.name,
      buyer_email: req.user.email,
      seller_id: String(product.owner_id),
      seller_name: product.owner_name,
      store_id: String(product.store_id),
      store_name: product.store_name,
      product_id,
      product_name: product.name,
      product_image: product.images?.[0] || "",
      product_grade: product.grade,
      product_category: product.category,
      amount,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_notes: shipping_notes || "",
      payment_method,
      payment_status: payment_method === "cod" ? "unpaid" : "unpaid",
      bank_name: bank_name || "",
      virtual_account,
      status: "pending",
      midtrans_order_id: orderId,
    });

    res.status(201).json({ ...order.toObject(), id: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simulasi bayar (untuk Transfer)
app.post("/payments/pay/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer_id: String(req.user.id),
    });
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    if (order.payment_status === "paid")
      return res.status(400).json({ message: "Sudah dibayar" });
    if (order.status === "cancelled")
      return res.status(400).json({ message: "Order dibatalkan" });

    order.payment_status = "paid";
    await order.save();

    res.json({
      message: "Pembayaran berhasil",
      order: { ...order.toObject(), id: order._id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buyer: batalkan pesanan (hanya kalau status masih pending)
app.post("/payments/cancel/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer_id: String(req.user.id),
    });
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    if (order.status !== "pending")
      return res
        .status(400)
        .json({
          message: "Pesanan tidak bisa dibatalkan setelah dikonfirmasi penjual",
        });

    order.status = "cancelled";
    order.cancelled_by = "buyer";
    order.cancel_reason = req.body.reason || "Dibatalkan oleh pembeli";
    order.cancelled_at = new Date();
    await order.save();

    res.json({
      message: "Pesanan dibatalkan",
      order: { ...order.toObject(), id: order._id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: konfirmasi pesanan
app.post("/payments/confirm/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      seller_id: String(req.user.id),
    });
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    if (order.status !== "pending")
      return res.status(400).json({ message: "Status tidak valid" });

    // Support accept/reject by seller via body { accept: true/false }
    const { accept } = req.body;
    if (accept === false) {
      order.status = "cancelled";
      order.cancelled_by = "seller";
      order.cancel_reason = req.body.reason || "Ditolak oleh penjual";
      order.cancelled_at = new Date();
      await order.save();
      return res.json({
        message: "Pesanan ditolak oleh penjual",
        order: { ...order.toObject(), id: order._id },
      });
    }

    // Default: accept the order
    order.status = "confirmed";
    order.confirmed_at = new Date();
    await order.save();

    // Update produk jadi sold (hapus dari stok)
    try {
      await axios.patch(
        `http://localhost:3002/products/${order.product_id}/status`,
        { status: "sold" },
        { headers: { Authorization: req.headers.authorization } },
      );
    } catch (e) {
      console.error(e.message);
    }

    res.json({
      message: "Pesanan diterima dan dikonfirmasi",
      order: { ...order.toObject(), id: order._id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: tandai dikirim
app.post("/payments/ship/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      seller_id: String(req.user.id),
    });
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    if (order.status !== "confirmed")
      return res.status(400).json({ message: "Konfirmasi pesanan dulu" });

    order.status = "shipped";
    order.tracking_number = req.body.tracking_number || "";
    order.shipped_at = new Date();
    await order.save();

    res.json({
      message: "Pesanan ditandai dikirim",
      order: { ...order.toObject(), id: order._id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buyer: tandai selesai
app.post("/payments/complete/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer_id: String(req.user.id),
    });
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    if (order.status !== "shipped")
      return res.status(400).json({ message: "Pesanan belum dikirim" });

    order.status = "completed";
    order.completed_at = new Date();
    await order.save();

    // Update stats toko
    try {
      const soldCount = await Order.countDocuments({
        seller_id: order.seller_id,
        status: "completed",
      });
      await axios.patch(
        `http://localhost:3005/stores/owner/${order.seller_id}/stats`,
        { total_sold: soldCount },
      );
    } catch (e) {
      console.error(e.message);
    }

    res.json({
      message: "Pesanan selesai",
      order: { ...order.toObject(), id: order._id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pesanan buyer
app.get("/payments/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ buyer_id: String(req.user.id) }).sort(
      "-createdAt",
    );
    res.json(orders.map((o) => ({ ...o.toObject(), id: o._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET detail pesanan
app.get("/payments/orders/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ message: "Order tidak ditemukan" });
    const isOwner =
      String(order.buyer_id) === String(req.user.id) ||
      String(order.seller_id) === String(req.user.id) ||
      req.user.role === "admin";
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });
    res.json({ ...order.toObject(), id: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pesanan seller
app.get("/payments/seller-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ seller_id: String(req.user.id) }).sort(
      "-createdAt",
    );
    res.json(orders.map((o) => ({ ...o.toObject(), id: o._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: semua pesanan
app.get("/admin/orders", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const orders = await Order.find().sort("-createdAt");
    res.json(orders.map((o) => ({ ...o.toObject(), id: o._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: statistik
app.get("/admin/stats", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ payment_status: "paid" });
    const revenue = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    res.json({ totalOrders, paidOrders, revenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", service: "payment" }));
app.listen(3004, () => console.log("Payment service: http://localhost:3004"));
