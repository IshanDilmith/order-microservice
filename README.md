# Order Microservice

Order Microservice is a Node.js/Express service that manages customer orders, order status updates, and order retrieval for an e-commerce platform. It connects to MongoDB, talks to other services through an API gateway, and exposes interactive API docs through Swagger UI.

## Features

- Create orders from the authenticated user's cart
- Update order status and send status notifications
- Fetch the authenticated user's orders
- Fetch a single order by ID
- List all orders
- JWT-protected routes
- Swagger UI documentation
- Docker support

## Tech Stack

- Node.js 20
- Express 5
- MongoDB with Mongoose
- JWT authentication
- Axios for gateway calls
- Swagger UI

## Project Structure

```text
.
├── server.js
├── swagger.json
├── Dockerfile
├── package.json
└── src
    ├── config
    │   └── db.js
    ├── controllers
    │   └── orderController.js
    ├── helpers
    │   └── gatewayFunc.js
    ├── middleware
    │   └── auth.js
    ├── models
    │   ├── Counter.js
    │   └── Order.js
    └── routes
        └── orders.js
```

## Requirements

- Node.js 20+
- MongoDB connection string
- API gateway URL for cart, auth, inventory, and notification calls
- JWT secret for protected routes

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=8003
DB_URI=your_mongodb_connection_string
GATEWAY_URL=https://your-api-gateway.example.com
JWT_SECRET=your_jwt_secret
```

### Notes

- The app defaults to port `8003` when `PORT` is not set.
- The Dockerfile currently exposes port `8003`, so set `PORT=8003` in container environments if you want the app to listen on that port.
- `GATEWAY_URL` must point to the upstream gateway that serves cart, auth, inventory, and notification endpoints.

## Installation

```bash
npm install
```

If you are running in a locked-down CI or container environment, use the safer install form when needed:

```bash
npm install --ignore-scripts
```

## Running Locally

Start the service:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Docker

Build the image:

```bash
docker build -t order-microservice .
```

Run the container:

```bash
docker run --rm -p 8003:8003 \
  -e PORT=8003 \
  -e DB_URI="your_mongodb_connection_string" \
  -e GATEWAY_URL="https://your-api-gateway.example.com" \
  -e JWT_SECRET="your_jwt_secret" \
  order-microservice
```

If you want the container to listen on the Dockerfile's exposed port, use `-p 8003:8003` and set `PORT=8003`.

## API Docs

Swagger UI is served from:

```text
/api-docs
```

The OpenAPI definition is stored in [swagger.json](swagger.json).

## API Overview

All order routes are mounted under `/orders` and protected by the JWT middleware.

### Health Check

- `GET /`

### Orders

- `POST /orders/create` - Create a new order
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/my-orders` - Get the authenticated user's orders
- `GET /orders/:id` - Get a single order by ID
- `GET /orders` - Get all orders

## Authentication

Protected endpoints expect a bearer token:

```http
Authorization: Bearer <jwt-token>
```

## Core Behavior

- Order creation pulls cart data and user email through the API gateway.
- Inventory updates and notification calls are handled through the gateway.
- Order IDs are generated in the format `ORD#0001`.
- The service stores `items`, `total`, `status`, `payMethod`, `deliveryAddress`, `province`, and `district` in MongoDB.

## Troubleshooting

- If the service fails to start, check that `DB_URI` is set.
- If gateway calls fail, confirm `GATEWAY_URL` is reachable and correctly configured.
- If requests return `401`, verify the JWT token and `JWT_SECRET`.
- If MongoDB connection fails, check network access and credentials.
