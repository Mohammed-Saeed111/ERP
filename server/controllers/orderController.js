import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';

export const addOrder = async (req, res) => {
    try {
        const { productID, quantity, total } = req.body;
        const userId = req.user._id;

        const quantityNumber = parseInt(quantity, 10);
        const totalPrice = parseFloat(total);

        if (!productID || Number.isNaN(quantityNumber) || quantityNumber < 1 || Number.isNaN(totalPrice) || totalPrice < 0) {
            return res.status(400).json({ success: false, message: "Invalid order data" });
        }

        const product = await Product.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (quantityNumber > product.stock) {
            return res.status(400).json({ success: false, message: "Not enough stock" });
        }

        product.stock -= quantityNumber;
        await product.save();

        const orderObj = new Order({
            customer: userId,
            product: productID,
            quantity: quantityNumber,
            totalPrice
        });

        await orderObj.save();

        return res.status(200).json({ success: true, message: "Order added successfully" });
    } catch (error) {
        console.log("Server error in adding order", error);
        return res.status(500).json({ success: false, message: "Server error in adding order" });
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        let query = {};
        if (req.user.role === 'customer') {
            query = { customer: userId };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'product',
                select: 'name price categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'categoryName'
                }
            })
            .populate('customer', 'name email');

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.log("Server error in fetching orders", error);
        return res.status(500).json({ success: false, message: "Server error in fetching orders" });
    }
};