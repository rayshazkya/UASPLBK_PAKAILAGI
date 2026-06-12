const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender_id: { type: String, required: true },
  sender_name: { type: String },
  sender_avatar: { type: String, default: '' },
  receiver_id: { type: String, required: true },
  receiver_name: { type: String },
  product_id: { type: String, default: null },
  product_name: { type: String, default: null },
  product_image: { type: String, default: null },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
