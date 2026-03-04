require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js');
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/orders', require('./routes/orders'));

// Swagger docs
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});