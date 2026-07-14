import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../server/db/connection.js";

import authRouter from "../server/routes/auth.js";
import categoryRoutes from "../server/routes/category.js";
import supplierRoutes from "../server/routes/supplier.js";
import productRoutes from "../server/routes/product.js";
import userRoutes from "../server/routes/user.js";
import orderRoutes from "../server/routes/order.js";
import dashboardRoutes from "../server/routes/dashboard.js";

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// ✅ root route (هيفتح على /api)
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// routes
app.use('/api/auth', authRouter);
app.use('/api/category', categoryRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ منع تكرار الاتصال
let isConnected = false;

async function connectOnce() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// ✅ handler لـ Vercel
export default async function handler(req, res) {
  await connectOnce();
  return app(req, res);
}