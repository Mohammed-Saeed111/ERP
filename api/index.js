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

// root
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// ✅ routes بدون /api
app.use('/auth', authRouter);
app.use('/category', categoryRoutes);
app.use('/supplier', supplierRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/dashboard', dashboardRoutes);

// DB connection مرة واحدة
let isConnected = false;

async function connectOnce() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// handler
export default async function handler(req, res) {
  await connectOnce();
  return app(req, res);
}