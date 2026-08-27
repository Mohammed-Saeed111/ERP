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

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// root
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

// DB connection (مرة واحدة بس - serverless safe)
let isConnected = false;

async function connectOnce() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// Connect to DB then export handler for Vercel
connectOnce().catch((err) => {
  console.error("❌ DB Connection Failed:", err.message);
});

export default app;
