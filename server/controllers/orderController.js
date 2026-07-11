import Product from '../models/Product.js';
import Order from '../models/Order.js';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];
const UPDATABLE_ORDER_STATUSES = ORDER_STATUSES.filter((status) => status !== 'Canceled');

const buildOrderItems = async (body) => {
    const items = [];
    const productIds = new Set();

    if (Array.isArray(body.orderItems) && body.orderItems.length > 0) {
        for (const item of body.orderItems) {
            if (!item.productID || Number.isNaN(Number(item.quantity)) || Number(item.quantity) < 1) {
                throw new Error('Invalid order item');
            }
            productIds.add(item.productID);
        }
    } else if (body.productID && body.quantity) {
        productIds.add(body.productID);
    } else {
        throw new Error('No order items provided');
    }

    const products = await Product.find({ _id: { $in: Array.from(productIds) } });
    if (products.length !== productIds.size) {
        throw new Error('One or more products not found');
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    if (Array.isArray(body.orderItems) && body.orderItems.length > 0) {
        for (const item of body.orderItems) {
            const product = productMap.get(item.productID);
            if (!product) {
                throw new Error('Product not found');
            }
            const quantity = Number(item.quantity);
            if (quantity < 1 || quantity > product.stock) {
                throw new Error(`Invalid quantity for ${product.name}`);
            }
            const unitPrice = Number(product.price || 0);
            items.push({
                product: product._id,
                name: product.name,
                categoryId: product.categoryId,
                unitPrice,
                quantity,
                totalPrice: Number((unitPrice * quantity).toFixed(2))
            });
        }
    } else {
        const product = productMap.get(body.productID);
        if (!product) {
            throw new Error('Product not found');
        }
        const quantity = Number(body.quantity);
        if (Number.isNaN(quantity) || quantity < 1 || quantity > product.stock) {
            throw new Error('Invalid quantity');
        }
        const unitPrice = Number(product.price || 0);
        items.push({
            product: product._id,
            name: product.name,
            categoryId: product.categoryId,
            unitPrice,
            quantity,
            totalPrice: Number((unitPrice * quantity).toFixed(2))
        });
    }

    return { items, productMap };
};

export const addOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { items, productMap } = await buildOrderItems(req.body);

        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));

        // adjust stock for all products after validation using bulkWrite
        await Product.bulkWrite(
            items.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: -item.quantity } }
                }
            }))
        );

        const orderObj = new Order({
            customer: userId,
            orderItems: items,
            totalQuantity,
            totalPrice,
            status: 'Pending'
        });

        await orderObj.save();

        return res.status(200).json({ success: true, message: 'Order added successfully', order: orderObj });
    } catch (error) {
        console.error('Server error in adding order', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error in adding order' });
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, startDate, endDate, customerId, search } = req.query;
        const query = {};

        if (req.user.role === 'customer') {
            query.customer = userId;
        } else if (customerId) {
            query.customer = customerId;
        }

        if (status && ORDER_STATUSES.includes(status)) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!Number.isNaN(start.getTime())) {
                    query.orderDate.$gte = start;
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!Number.isNaN(end.getTime())) {
                    end.setHours(23, 59, 59, 999);
                    query.orderDate.$lte = end;
                }
            }
        }

        const orders = await Order.find(query)
            .sort({ orderDate: -1 })
            .populate({
                path: 'orderItems.product',
                select: 'name price categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'categoryName'
                }
            })
            .populate('customer', 'name email');

        const filteredOrders = search && search.trim()
            ? orders.filter((order) => {
                const term = search.trim().toLowerCase();
                const productMatches = order.orderItems.some((item) => item.name.toLowerCase().includes(term));
                const customerName = order.customer?.name?.toLowerCase() || '';
                const customerEmail = order.customer?.email?.toLowerCase() || '';
                return productMatches || customerName.includes(term) || customerEmail.includes(term);
            })
            : orders;

        return res.status(200).json({ success: true, orders: filteredOrders });
    } catch (error) {
        console.error('Server error in fetching orders', error);
        return res.status(500).json({ success: false, message: 'Server error in fetching orders' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!status || !UPDATABLE_ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === status) {
            return res.status(200).json({ success: true, order, message: 'Order status unchanged' });
        }

        order.status = status;
        await order.save();

        const updatedOrder = await Order.findById(id)
            .populate({
                path: 'orderItems.product',
                select: 'name price categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'categoryName'
                }
            })
            .populate('customer', 'name email');

        return res.status(200).json({ success: true, order: updatedOrder, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Server error in updating order status', error);
        return res.status(500).json({ success: false, message: 'Server error in updating order status' });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden: cannot cancel this order' });
        }

        if (order.status === 'Canceled') {
            return res.status(400).json({ success: false, message: 'Order is already canceled' });
        }

        const cancellableStatuses = req.user.role === 'admin'
            ? ['Pending', 'Processing']
            : ['Pending'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'This order can no longer be canceled'
            });
        }

        // restore stock using bulkWrite
        await Product.bulkWrite(
            order.orderItems.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: item.quantity } }
                }
            }))
        );

        order.status = 'Canceled';
        await order.save();

        const updatedOrder = await Order.findById(id)
            .populate({
                path: 'orderItems.product',
                select: 'name price categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'categoryName'
                }
            })
            .populate('customer', 'name email');

        return res.status(200).json({ success: true, order: updatedOrder, message: 'Order canceled and stock restored' });
    } catch (error) {
        console.error('Server error in cancelling order', error);
        return res.status(500).json({ success: false, message: 'Server error in cancelling order' });
    }
};

export const restoreOrder = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
        }

        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Canceled') {
            return res.status(400).json({ success: false, message: 'Only canceled orders can be restored' });
        }

        const productIds = order.orderItems.map((item) => item.product);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((prod) => [prod._id.toString(), prod]));

        for (const item of order.orderItems) {
            const product = productMap.get(item.product.toString());
            if (!product) {
                return res.status(400).json({ success: false, message: `Product ${item.name} not available` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock to restore ${item.name}` });
            }
        }

        await Product.bulkWrite(
            order.orderItems.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: -item.quantity } }
                }
            }))
        );

        order.status = 'Pending';
        await order.save();

        const updatedOrder = await Order.findById(id)
            .populate({
                path: 'orderItems.product',
                select: 'name price categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'categoryName'
                }
            })
            .populate('customer', 'name email');

        return res.status(200).json({ success: true, order: updatedOrder, message: 'Order restored and stock reserved' });
    } catch (error) {
        console.error('Server error in restoring order', error);
        return res.status(500).json({ success: false, message: 'Server error in restoring order' });
    }
};
