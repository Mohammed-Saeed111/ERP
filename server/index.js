import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/connection.js";

import authRouter from "./routes/auth.js";
import categoryRoutes from "./routes/category.js";
import supplierRoutes from "./routes/supplier.js";
import productRoutes from "./routes/product.js";
import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// root
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// routes
app.use("/auth", authRouter);
app.use("/category", categoryRoutes);
app.use("/supplier", supplierRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/dashboard", dashboardRoutes);

// DB connection (مرة واحدة بس)
let isConnected = false;

async function connectOnce() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// 🔥 تشغيل السيرفر
const PORT = process.env.PORT || 5000;

connectOnce()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err.message);
  });