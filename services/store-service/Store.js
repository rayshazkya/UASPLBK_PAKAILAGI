const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  owner_name: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  total_products: { type: Number, default: 0 },
  total_sold: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
