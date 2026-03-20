const Order = require("../models/Order");
const Counter = require("../models/Counter");
const { callViaGateway } = require("../helpers/gatewayFunc");

//create order
createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payMethod } = req.body;
    const { totalDiscount = 0, deliveryFee = 0 } = req.body; // Optional fields with defaults

    // Get Cart Data
    const cartData = await callViaGateway(
      "GET",
      `/cart/${userId}`,
      {},
      req.headers,
    );
    if (!cartData.items?.length)
      return res.status(400).json({ error: "Cart is empty" });

    // Fetch User Email
    const userData = await callViaGateway(
      "GET",
      `/users/${userId}`,
      {},
      req.headers,
    );

    if (!userData.email)
      return res.status(400).json({ error: "User email not found" });
  

    const userEmail = userData.email;

    const items = cartData.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price || 0,
    }));

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ) - totalDiscount + deliveryFee;

    // Increment Counter and Get Custom ID
    // This finds the "order_id" doc, increments seq by 1, and returns the NEW doc
    const counter = await Counter.findOneAndUpdate(
      { id: "order_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    // Format: ORD# followed by sequence padded to 4 digits
    const customOrderId = `ORD#${counter.seq.toString().padStart(4, "0")}`;

    // Save Order with Custom ID
    const order = new Order({
      orderId: customOrderId,
      userId,
      items,
      total,
      status: "Pending",
      payMethod,
      totalDiscount,
      deliveryFee,
    });

    let inventoryError = false;

    // Update Inventory
    for (const item of items) {
      try {
        await callViaGateway(
          "PUT",
          `/inventory/products/${item.productId}`,
          { quantity: item.quantity }, // send quantity to decrement
          req.headers,
        );
      } catch (err) {
        console.error(`Error updating inventory for product ${item.productId}:`, err);
        inventoryError = true;
      }
    }

    if (inventoryError) {
      return res.status(500).json({ error: "Failed to update inventory for one or more items" });
    }

    await order.save();

    // Send Notification
    const notification = await callViaGateway(
      "POST",
      "/notification/send",
      {
        email: userEmail,
        orderId: customOrderId
      },
      req.headers,
    );

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
      `/users/${order.userId}`,
      {},
      req.headers,
    );

    if (!userData.email) return res.status(400).json({ error: "User email not found" });

    // Send Status Update Notification
    const notification = await callViaGateway(
      "POST",
      "/notification/send",
      {
        email: userData.email,
        orderId: order.orderId,
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
