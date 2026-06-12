const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer_id: { type: String, required: true },
    buyer_name: { type: String },
    buyer_email: { type: String },
    seller_id: { type: String },
    seller_name: { type: String },
    store_id: { type: String },
    store_name: { type: String },
    product_id: { type: String, required: true },
    product_name: { type: String },
    product_image: { type: String },
    product_grade: { type: String },
    product_category: { type: String },
    amount: { type: Number, required: true },

    shipping_name: { type: String },
    shipping_phone: { type: String },
    shipping_address: { type: String },
    shipping_city: { type: String },
    shipping_notes: { type: String, default: "" },

    payment_method: {
      type: String,
      enum: ["transfer", "cod"],
      default: "transfer",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    bank_name: { type: String, default: "" },
    virtual_account: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "completed", "cancelled"],
      default: "pending",
    },

    tracking_number: { type: String, default: "" },
    cancelled_by: { type: String, default: "" },
    cancel_reason: { type: String, default: "" },
    confirmed_at: { type: Date },
    shipped_at: { type: Date },
    completed_at: { type: Date },
    cancelled_at: { type: Date },
    midtrans_order_id: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
