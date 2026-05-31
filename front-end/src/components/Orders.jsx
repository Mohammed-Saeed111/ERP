import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig.js';

const Orders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/orders');

            if (response.data.success) {
                setOrders(response.data.orders);
            } else {
                console.error('Failed to fetch orders', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching orders', error);
            alert(error?.response?.data?.message || 'Unable to load orders. Please login again.');
        }
    };

    return (
        <div className="p-4">

            {/* Header */}
            <div className="font-bold text-xl mb-4">
                Your Orders
            </div>

            {/* Table Container */}
            <div className="bg-white shadow rounded overflow-hidden">

                <table className="w-full text-left">

                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border-b">#</th>
                            <th className="p-3 border-b">Product</th>
                            <th className="p-3 border-b">Category</th>
                            <th className="p-3 border-b">Qty</th>
                            <th className="p-3 border-b">Total</th>
                            <th className="p-3 border-b">Date</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((order, index) => (
                                <tr key={order._id} className="hover:bg-gray-50">

                                    <td className="p-3 border-b">
                                        {index + 1}
                                    </td>

                                    <td className="p-3 border-b">
                                        {order.product?.name}
                                    </td>

                                    <td className="p-3 border-b">
                                        {order.product?.categoryId?.categoryName || '-'}
                                    </td>

                                    <td className="p-3 border-b">
                                        {order.quantity}
                                    </td>

                                    <td className="p-3 border-b font-semibold">
                                        ${order.totalPrice}
                                    </td>

                                    <td className="p-3 border-b">
                                        {new Date(order.orderDate).toLocaleDateString()}
                                    </td>

                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-4">
                                    No orders found
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>
        </div>
    );
};

export default Orders;