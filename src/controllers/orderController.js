const Order = require("../models/Order");
const Counter = require("../models/Counter");
const { callViaGateway } = require("../helpers/gatewayFunc");

//create order
createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payMethod, deliveryAddress, province, district, totalDiscount = 0, deliveryFee = 0 } = req.body;

    // Get Cart Data
    const cartData = await callViaGateway("GET", `/cart/${userId}`, {}, req.headers);
    const cart = cartData.data; 
    
    if (!cart?.items?.length) return res.status(400).json({ error: "Cart is empty" });

    // Fetch User Email
    const userData = await callViaGateway("GET", `/auth/users/${userId}`, {}, req.headers);
    if (!userData.user?.email) return res.status(400).json({ error: "User email not found" });
    
    const userEmail = userData.user.email;

    // Calculate Pricing Securely in Backend
    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price || 0,
    }));

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    ) - totalDiscount + deliveryFee;

    // Generate Custom Order ID
    const counter = await Counter.findOneAndUpdate(
      { id: "order_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const customOrderId = `ORD#${counter.seq.toString().padStart(4, "0")}`;

    // Update Inventory concurrently to prevent sequential timeout compounding
    try {
      await Promise.all(items.map(item =>
        callViaGateway("PATCH", `/inventory/products/${item.productId}/stock`, { quantity: item.quantity }, req.headers)
      ));
    } catch (err) {
      console.error("Non-critical Error: Failed to update inventory for one or more products:", err.message);
    }

    // Save Order
    const order = new Order({
      orderId: customOrderId,
      userId,
      items,
      total,
      status: "Pending",
      payMethod,
      totalDiscount,
      deliveryFee,
      deliveryAddress,
      province,
      district
    });

    await order.save();

    // Clear the Cart Natively via Backend
    try {
      await callViaGateway("DELETE", `/cart/clear/${userId}`, {}, req.headers); 
    } catch (err) {
      console.error("Non-critical Error: Failed to automatically clear user cart", err);
    }

    // Send Notification
    let notification = null;
    try {
      notification = await callViaGateway("POST", "/notification/send", {
        type: "order_confirmation",
        email: userEmail,
        orderId: order._id
      }, req.headers);
    } catch (err) {
      console.error("Non-critical Error: Failed to send email notification", err);
    }

    // Successfully Respond
    res.status(201).json({ success: true, order, notification });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Update Order Status
updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    // Fetch User Email again to notify about the status change
    const userData = await callViaGateway(
      "GET",
      `/auth/users/${order.userId}`,
      {},
      req.headers,
    );

    if (!userData.user?.email) return res.status(400).json({ error: "User email not found" });

    // Send Status Update Notification
    const notification = await callViaGateway(
      "POST",
      "/notification/send",
      {
        type: "order_status_update",
        email: userData.user.email,
        orderId: order._id,
      },
      req.headers,
    );

    res.json({ success: true, order, notification });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

// Get Orders for Authenticated User
getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// get a single order by ID
getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// get all orders
getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

module.exports = {
  createOrder,
  updateOrderStatus,
  getUserOrders,
  getOrderById,
  getAllOrders,
};
