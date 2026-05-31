import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
import connectDB from './db/connection.js';
import User from './models/User.js';
import authRouter from './routes/auth.js';
import categoryRoutes from './routes/category.js';
import supplierRoutes from './routes/supplier.js';
import productRoutes from './routes/product.js';
import userRoutes from './routes/user.js';
import orderRoutes from './routes/order.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter);
app.use('/api/category', categoryRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

const ensureDefaultUsers = async () => {
  const defaultAdminEmail = 'admin@gmail.com';
  const defaultUserEmail = 'user@example.com';

  const admin = await User.findOne({ email: defaultAdminEmail });
  if (!admin) {
    const hashPassword = await bcrypt.hash('admin', 10);
    await User.create({
      name: 'admin',
      email: defaultAdminEmail,
      password: hashPassword,
      address: 'admin address',
      role: 'admin'
    });
    console.log(`Default admin created: ${defaultAdminEmail} / admin`);
  }

  const customer = await User.findOne({ email: defaultUserEmail });
  if (!customer) {
    const hashPassword = await bcrypt.hash('user', 10);
    await User.create({
      name: 'testuser',
      email: defaultUserEmail,
      password: hashPassword,
      address: 'Test address',
      role: 'customer'
    });
    console.log(`Default customer created: ${defaultUserEmail} / user`);
  }
};

const startServer = async () => {
  await connectDB();
  await ensureDefaultUsers();

  app.listen(PORT, () => {
    console.log(`server is running on ${PORT} port`);
  });
};

startServer();