const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  size: { type: String, enum: ['XS','S','M','L','XL','XXL','XXXL','One Size'], required: true },
  grade: { type: String, enum: ['A','B','C'], required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  images: [{ type: String }],
  status: { type: String, enum: ['available','sold'], default: 'available' },
  store_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  store_name: { type: String },
  owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  owner_name: { type: String },
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
