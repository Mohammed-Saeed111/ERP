import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../db/connection.js";

import authRouter from "../routes/auth.js";
import categoryRoutes from "../routes/category.js";
import supplierRoutes from "../routes/supplier.js";
import productRoutes from "../routes/product.js";
import userRoutes from "../routes/user.js";
import orderRoutes from "../routes/order.js";
import dashboardRoutes from "../routes/dashboard.js";

dotenv.config();

const app = express();

// Trust Vercel's proxy (needed for rate limiting and IP detection)
app.set('trust proxy', 1);

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// root health check
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// routes
app.use("/api/auth", authRouter);
app.use("/api/category", categoryRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serverless: connect on each cold start, cache the connection
let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error("❌ DB Connection Failed:", err.message);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  return app(req, res);
};

export default handler;
