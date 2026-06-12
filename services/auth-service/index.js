require('dotenv').config({ path: '../../.env' });
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./User');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/avatars', express.static('avatars'));

if (!fs.existsSync('avatars')) fs.mkdirSync('avatars');

const storage = multer.diskStorage({
  destination: 'avatars/',
  filename: (req, file, cb) => cb(null, `avatar_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'fashionrescue_jwt_secret_2024';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Auth service connected to MongoDB');
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({ name: 'Admin', email: 'admin@fashionrescue.com', password: hashed, role: 'admin' });
      console.log('Admin seeded: admin@fashionrescue.com / admin123');
    }
  })
  .catch(err => console.error('MongoDB error:', err));

const makeToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role, name: user.name, has_store: user.has_store },
  JWT_SECRET, { expiresIn: '7d' }
);

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Token tidak valid' }); }
};

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email sudah terdaftar' });

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, has_store: false, avatar: '' } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Email atau password salah' });
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, has_store: user.has_store, avatar: user.avatar, phone: user.phone, address: user.address, bio: user.bio } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get me
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, has_store: user.has_store, avatar: user.avatar, phone: user.phone, address: user.address, bio: user.bio });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update profile
app.put('/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone, address, bio }, { new: true }).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, has_store: user.has_store, avatar: user.avatar, phone: user.phone, address: user.address, bio: user.bio });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upload avatar
app.post('/auth/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });
    const avatar_url = `/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatar: avatar_url });
    res.json({ avatar: avatar_url });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Change password
app.put('/auth/password', authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await bcrypt.compare(old_password, user.password)))
      return res.status(400).json({ message: 'Password lama salah' });
    if (new_password.length < 6)
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    user.password = await bcrypt.hash(new_password, 10);
    await user.save();
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Internal: update has_store flag
app.patch('/auth/users/:id/has-store', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { has_store: req.body.has_store });
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get user by id (internal)
app.get('/auth/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar, has_store: user.has_store });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: list all users
app.get('/auth/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const users = await User.find({ role: 'user' }).select('-password').sort('-createdAt');
    res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, has_store: u.has_store, avatar: u.avatar, createdAt: u.createdAt })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth' }));
app.listen(3001, () => console.log('Auth service: http://localhost:3001'));
