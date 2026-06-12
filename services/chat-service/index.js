require('dotenv').config({ path: '../../.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Chat = require('./Chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fashionrescue_jwt_secret_2024';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Chat service connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Token tidak valid' }); }
};

// GET daftar room chat
app.get('/chats/rooms', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const chats = await Chat.find({
      $or: [{ sender_id: userId }, { receiver_id: userId }]
    }).sort('-createdAt');

    const roomMap = new Map();
    for (const chat of chats) {
      const isMe = chat.sender_id === userId;
      const partnerId = isMe ? chat.receiver_id : chat.sender_id;
      const partnerName = isMe ? chat.receiver_name : chat.sender_name;
      const partnerAvatar = isMe ? '' : chat.sender_avatar;

      if (!roomMap.has(partnerId)) {
        roomMap.set(partnerId, {
          partner_id: partnerId,
          partner_name: partnerName || 'User',
          partner_avatar: partnerAvatar || '',
          product_id: chat.product_id,
          product_name: chat.product_name,
          product_image: chat.product_image,
          last_message: chat.message,
          last_time: chat.createdAt,
          unread_count: 0
        });
      }

      const room = roomMap.get(partnerId);
      if (chat.receiver_id === userId && !chat.is_read) {
        room.unread_count++;
        roomMap.set(partnerId, room);
      }
    }

    res.json([...roomMap.values()]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET pesan antara dua user
app.get('/chats/:partnerId', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const partnerId = req.params.partnerId;

    const messages = await Chat.find({
      $or: [
        { sender_id: userId, receiver_id: partnerId },
        { sender_id: partnerId, receiver_id: userId }
      ]
    }).sort('createdAt');

    await Chat.updateMany(
      { sender_id: partnerId, receiver_id: userId, is_read: false },
      { is_read: true }
    );

    res.json(messages.map(m => ({ ...m.toObject(), id: m._id })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST kirim pesan
app.post('/chats', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, receiver_name, message, product_id, product_name, product_image } = req.body;
    if (!receiver_id || !message)
      return res.status(400).json({ message: 'receiver_id dan message wajib diisi' });

    const chat = await Chat.create({
      sender_id: String(req.user.id),
      sender_name: req.user.name,
      sender_avatar: '',
      receiver_id: String(receiver_id),
      receiver_name: receiver_name || '',
      message,
      product_id: product_id || null,
      product_name: product_name || null,
      product_image: product_image || null
    });

    const result = { ...chat.toObject(), id: chat._id };
    io.to(`user_${receiver_id}`).emit('new_message', result);
    io.to(`user_${req.user.id}`).emit('new_message', result);

    res.status(201).json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET unread count
app.get('/chats/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Chat.countDocuments({ receiver_id: String(req.user.id), is_read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Socket.IO
io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) { socket.disconnect(); return; }
  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.join(`user_${user.id}`);
    socket.on('disconnect', () => {});
  } catch { socket.disconnect(); }
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'chat' }));
server.listen(3003, () => console.log('Chat service: http://localhost:3003'));
