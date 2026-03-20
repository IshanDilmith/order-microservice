const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  userId: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalDiscount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true }, // after discount and adding delivery fee
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Notified', 'Failed'],
    default: 'Pending'
  },
  payMethod: {
    type: String,
    enum: ['COD', 'Card'],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  notifiedAt: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);