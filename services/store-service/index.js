require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('./Store');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/store-images', express.static('store-images'));

if (!fs.existsSync('store-images')) fs.mkdirSync('store-images');

const storage = multer.diskStorage({
  destination: 'store-images/',
  filename: (req, file, cb) => cb(null, `store_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'fashionrescue_jwt_secret_2024';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Store service connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Token tidak valid' }); }
};

// Daftar toko baru
app.post('/stores', authMiddleware, async (req, res) => {
  try {
    const existing = await Store.findOne({ owner_id: req.user.id });
    if (existing) return res.status(400).json({ message: 'Kamu sudah memiliki toko' });

    const { name, description, address, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama toko wajib diisi' });

    const store = await Store.create({
      owner_id: req.user.id,
      owner_name: req.user.name,
      name, description, address, phone
    });

    // Update flag has_store di auth-service
    try {
      await axios.patch(`http://localhost:3001/auth/users/${req.user.id}/has-store`, { has_store: true });
    } catch (e) { console.error('Update has_store error:', e.message); }

    res.status(201).json({ ...store.toObject(), id: store._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get toko milik sendiri
app.get('/stores/my', authMiddleware, async (req, res) => {
  try {
    const store = await Store.findOne({ owner_id: req.user.id });
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    res.json({ ...store.toObject(), id: store._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get toko by id (public)
app.get('/stores/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    res.json({ ...store.toObject(), id: store._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get toko by owner_id (public)
app.get('/stores/owner/:ownerId', async (req, res) => {
  try {
    const store = await Store.findOne({ owner_id: req.params.ownerId });
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    res.json({ ...store.toObject(), id: store._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get semua toko (public)
app.get('/stores', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { is_active: true };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const stores = await Store.find(filter).sort('-createdAt');
    res.json(stores.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update toko
app.put('/stores/my', authMiddleware, async (req, res) => {
  try {
    const { name, description, address, phone } = req.body;
    const store = await Store.findOneAndUpdate(
      { owner_id: req.user.id },
      { name, description, address, phone },
      { new: true }
    );
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    res.json({ ...store.toObject(), id: store._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upload logo toko
app.post('/stores/my/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });
    const logo = `/store-images/${req.file.filename}`;
    await Store.findOneAndUpdate({ owner_id: req.user.id }, { logo });
    res.json({ logo });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upload banner toko
app.post('/stores/my/banner', authMiddleware, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });
    const banner = `/store-images/${req.file.filename}`;
    await Store.findOneAndUpdate({ owner_id: req.user.id }, { banner });
    res.json({ banner });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Internal: update stats toko
app.patch('/stores/owner/:ownerId/stats', async (req, res) => {
  try {
    const { total_products, total_sold } = req.body;
    const update = {};
    if (total_products !== undefined) update.total_products = total_products;
    if (total_sold !== undefined) update.total_sold = total_sold;
    await Store.findOneAndUpdate({ owner_id: req.params.ownerId }, update);
    res.json({ message: 'Stats updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: semua toko
app.get('/admin/stores', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const stores = await Store.find().sort('-createdAt');
    res.json(stores.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: toggle aktif/nonaktif toko
app.patch('/admin/stores/:id/toggle', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    store.is_active = !store.is_active;
    await store.save();
    res.json({ message: `Toko ${store.is_active ? 'diaktifkan' : 'dinonaktifkan'}`, is_active: store.is_active });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'store' }));
app.listen(3005, () => console.log('Store service: http://localhost:3005'));
