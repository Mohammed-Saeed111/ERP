import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js'; 
import Category from './models/Category.js';
import Supplier from './models/Supplier.js';
import connectDB from './db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') }); 

const register = async () => {
    try {
        await connectDB();

        const hashPassword = await bcrypt.hash('admin', 10); 

        try {
            const newUser = new User({
                name: 'admin',
                email: 'admin@gmail.com',
                password: hashPassword,
                address: 'admin address',
                role: 'admin'
            });

            await newUser.save();
            console.log("admin user created successfully");
        } catch (userError) {
            console.log("admin user already exists, continuing...");
        }

        // Create a test customer user for convenience (email: user@example.com, password: user)
        try {
            const hashUserPassword = await bcrypt.hash('user', 10);

            const testUser = new User({
                name: 'testuser',
                email: 'user@example.com',
                password: hashUserPassword,
                address: 'Test address',
                role: 'customer'
            });

            await testUser.save();
            console.log("test customer user created: user@example.com / user");
        } catch (userError) {
            console.log("test customer user already exists, continuing...");
        }

        // Create sample categories
        const categories = [
            { categoryName: 'Electronics', categoryDescription: 'Electronic devices and gadgets' },
            { categoryName: 'Clothing', categoryDescription: 'Apparel and fashion items' },
            { categoryName: 'Food & Beverage', categoryDescription: 'Food and drink products' }
        ];

        for (const cat of categories) {
            const exists = await Category.findOne({ categoryName: cat.categoryName });
            if (!exists) {
                await Category.create(cat);
                console.log(`Category "${cat.categoryName}" created`);
            } else {
                console.log(`Category "${cat.categoryName}" already exists`);
            }
        }

        // Create sample suppliers
        const suppliers = [
            { name: 'Supplier A', email: 'supplier-a@example.com', number: '1234567890', address: 'Address A' },
            { name: 'Supplier B', email: 'supplier-b@example.com', number: '0987654321', address: 'Address B' },
            { name: 'Supplier C', email: 'supplier-c@example.com', number: '5555555555', address: 'Address C' }
        ];

        for (const sup of suppliers) {
            const exists = await Supplier.findOne({ email: sup.email });
            if (!exists) {
                await Supplier.create(sup);
                console.log(`Supplier "${sup.name}" created`);
            } else {
                console.log(`Supplier "${sup.name}" already exists`);
            }
        }

        console.log("Seed completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

register();