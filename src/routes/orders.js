const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Create Order
router.post('/create', auth, orderController.createOrder);

// Update Status
router.patch('/:id/status', auth, orderController.updateOrderStatus);

// Get User Orders
router.get('/my-orders', auth, orderController.getUserOrders);

// Get Order by ID
router.get('/:id', auth, orderController.getOrderById);

// Get All Orders
router.get('/', auth, orderController.getAllOrders);

module.exports = router;