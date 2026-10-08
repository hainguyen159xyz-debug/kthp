const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    carrier: {
      type: String,
      default: 'Giao Hàng Nhanh'
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'ready_to_ship', 'in_transit', 'delivered', 'failed', 'returned'],
      default: 'pending'
    },
    shippedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
