const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// CREATE ORDER
router.post('/create', auth, async (req, res) => {
  try {
    const { userId } = req.auth; // from JWT

    // Get cart items from Cart service via Gateway
    const cartData = await callViaGateway('GET', `/cart/${userId}`, {}, req.headers);
    if (!cartData.items || cartData.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total & prepare items with price
    const items = cartData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price || 0 // assume Cart returns price
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const order = new Order({
      userId,
      items,
      totalDiscount,
      total,
      status: 'Pending'
    });
    await order.save();

    // Reduce stock in Inventory (one by one)
    for (const item of items) {
      await callViaGateway('PUT', `/inventory/products/${item.productId}`, {
        quantity: item.quantity  // subtract this amount
      }, req.headers);
    }

    // Send confirmation notification
    await callViaGateway('POST', '/notification/send', {
      orderId: order._id.toString(),
      message: `Order ${order._id} placed successfully! Total: $${total}`
    }, req.headers);

    res.status(201).json({
      orderId: order._id,
      status: order.status,
      total: order.total,
      totalDiscount: order.totalDiscount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// UPDATE STATUS (called by Notification service)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = req.body.status;
    if (req.body.notifiedAt) order.notifiedAt = req.body.notifiedAt;
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;