import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { CSVLink } from 'react-csv';
import api from '../utils/axiosConfig.js';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];
const STATUS_STYLES = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-slate-100 text-slate-800',
    Delivered: 'bg-emerald-100 text-emerald-700',
    Canceled: 'bg-rose-100 text-rose-700'
};

const Orders = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchOrders(controller.signal);
        return () => controller.abort();
    }, []);

    const fetchOrders = async (signal, query = {}) => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            const querySearch = query.search ?? search;
            const queryStatus = query.status ?? statusFilter;
            const queryStartDate = query.startDate ?? startDate;
            const queryEndDate = query.endDate ?? endDate;

            if (querySearch?.trim()) params.set('search', querySearch.trim());
            if (queryStatus) params.set('status', queryStatus);
            if (queryStartDate) params.set('startDate', queryStartDate);
            if (queryEndDate) params.set('endDate', queryEndDate);

            const response = await api.get(`/api/orders?${params.toString()}`, { signal });

            if (response.data.success) {
                setOrders(response.data.orders || []);
            } else {
                setError(response.data.message || 'Failed to load orders.');
            }
        } catch (fetchError) {
            if (fetchError.name === 'CanceledError' || fetchError.name === 'AbortError') {
                return;
            }
            console.error('Error fetching orders', fetchError);
            setError(fetchError?.response?.data?.message || 'Unable to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders;
    }, [orders]);

    const summary = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
        const totalQuantity = filteredOrders.reduce((sum, order) => sum + Number(order.totalQuantity || order.orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 0), 0);
        const averageOrder = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;

        return {
            orderCount: filteredOrders.length,
            totalRevenue,
            totalQuantity,
            averageOrder
        };
    }, [filteredOrders]);

    const statusCounts = useMemo(() => {
        return ORDER_STATUSES.reduce((acc, status) => {
            acc[status] = filteredOrders.filter((order) => order.status === status).length;
            return acc;
        }, {});
    }, [filteredOrders]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        fetchOrders(new AbortController().signal, { search: '', status: '', startDate: '', endDate: '' });
    };

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 3500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setStatusUpdate(order.status || 'Pending');
        setStatusMessage('');
    };

    const handleCancelOrder = async (orderId) => {
        setStatusLoading(true);
        setStatusMessage('');

        try {
            const response = await api.patch(`/api/orders/${orderId}/cancel`);
            if (response.data.success) {
                showToast('success', 'تم إلغاء الطلب بنجاح.');
                setStatusMessage('Order canceled successfully.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                showToast('error', response.data.message || 'فشل إلغاء الطلب.');
                setStatusMessage(response.data.message || 'Failed to cancel order.');
            }
        } catch (error) {
            console.error('Error canceling order', error);
            const message = error.response?.data?.message || 'Error canceling order.';
            showToast('error', message);
            setStatusMessage(message);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleRestoreOrder = async (orderId) => {
        setStatusLoading(true);
        setStatusMessage('');

        try {
            const response = await api.patch(`/api/orders/${orderId}/restore`);
            if (response.data.success) {
                showToast('success', 'تم استعادة الطلب بنجاح.');
                setStatusMessage('Order restored successfully.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                showToast('error', response.data.message || 'فشل استعادة الطلب.');
                setStatusMessage(response.data.message || 'Failed to restore order.');
            }
        } catch (error) {
            console.error('Error restoring order', error);
            const message = error.response?.data?.message || 'Error restoring order.';
            showToast('error', message);
            setStatusMessage(message);
        } finally {
            setStatusLoading(false);
        }
    };

    const closeOrderDetails = () => {
        setSelectedOrder(null);
        setStatusMessage('');
    };

    const handleSaveStatus = async () => {
        if (!selectedOrder || !statusUpdate) return;
        setStatusLoading(true);
        setStatusMessage('');

        try {
            const response = await api.patch(`/api/orders/${selectedOrder._id}/status`, {
                status: statusUpdate
            });

            if (response.data.success) {
                showToast('success', 'تم تحديث حالة الطلب بنجاح.');
                setStatusMessage('تم تحديث حالة الطلب بنجاح.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                const message = response.data.message || 'فشل تحديث الحالة.';
                showToast('error', message);
                setStatusMessage(message);
            }
        } catch (error) {
            console.error('Error updating order status', error);
            setStatusMessage(error.response?.data?.message || 'خطأ في تحديث حالة الطلب.');
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-6 flex flex-col gap-4 lg:items-center lg:justify-between lg:flex-row">
                <div>
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-sm text-slate-500">عرض الطلبات مع ملخص الأداء السريع.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 w-full lg:w-auto">
                    <div className="rounded-lg bg-slate-100 px-4 py-4 text-sm">
                        <p className="font-semibold text-slate-900">عدد الطلبات</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{summary.orderCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-4 py-4 text-sm">
                        <p className="font-semibold text-slate-900">إجمالي المبيعات</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">${summary.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-4 py-4 text-sm">
                        <p className="font-semibold text-slate-900">الكمية الإجمالية</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalQuantity}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-4 py-4 text-sm">
                        <p className="font-semibold text-slate-900">متوسط قيمة الطلب</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">${summary.averageOrder.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search product or customer</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search orders..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">All statuses</option>
                            {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => fetchOrders(new AbortController().signal)}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {toast && (
                <div className={`mb-4 rounded-3xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {toast.message}
                </div>
            )}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    {ORDER_STATUSES.map((status) => (
                        <div key={status} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-sm text-slate-500">{status}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{statusCounts[status]}</p>
                        </div>
                    ))}
                </div>
                <div className="inline-flex items-center gap-3">
                    {orders.length > 0 && (
                        <CSVLink
                            data={orders.map((order) => ({
                                orderId: order._id,
                                customer: order.customer?.name || order.customer?.email || '-',
                                items: order.orderItems?.map((item) => `${item.name} x${item.quantity}`).join(' | '),
                                totalQuantity: order.totalQuantity || order.orderItems?.reduce((sum, item) => sum + item.quantity, 0),
                                totalPrice: order.totalPrice,
                                status: order.status,
                                date: order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : ''
                            }))}
                            filename="orders.csv"
                            className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                        >
                            Export CSV
                        </CSVLink>
                    )}
                </div>
            </div>

            {!loading && (
                <div className="bg-white shadow rounded overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 border-b">#</th>
                                {isAdmin && <th className="p-3 border-b">Customer</th>}
                                <th className="p-3 border-b">Products</th>
                                <th className="p-3 border-b">Qty</th>
                                <th className="p-3 border-b">Total</th>
                                <th className="p-3 border-b">Status</th>
                                <th className="p-3 border-b">Date</th>
                                <th className="p-3 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map((order, index) => {
                                    const status = order.status || 'Pending';
                                    const statusClasses = STATUS_STYLES[status] || 'bg-slate-100 text-slate-800';
                                    const totalQuantity = order.totalQuantity || order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                    const firstItem = order.orderItems?.[0];
                                    const productLabel = firstItem ? `${firstItem.name}${order.orderItems?.length > 1 ? ` +${order.orderItems.length - 1} more` : ''}` : '-';

                                    return (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="p-3 border-b">{index + 1}</td>
                                            {isAdmin && (
                                                <td className="p-3 border-b">
                                                    {order.customer?.name || order.customer?.email || '-'}
                                                </td>
                                            )}
                                            <td className="p-3 border-b">{productLabel}</td>
                                            <td className="p-3 border-b">{totalQuantity}</td>
                                            <td className="p-3 border-b font-semibold">${Number(order.totalPrice || 0).toFixed(2)}</td>
                                            <td className="p-3 border-b">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-3 border-b">{order.orderDate ? new Date(order.orderDate).toLocaleString() : '-'}</td>
                                            <td className="p-3 border-b space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openOrderDetails(order)}
                                                    className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                                                >
                                                    Details
                                                </button>
                                                {status !== 'Canceled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-200 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {status === 'Canceled' && isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreOrder(order._id)}
                                                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 transition"
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="text-center p-4">
                                        لا توجد طلبات للعرض
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Order details</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">#{selectedOrder._id.slice(-6)}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeOrderDetails}
                                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Customer</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.customer?.name || '-'}</p>
                                <p className="text-sm text-slate-500">{selectedOrder.customer?.email || ''}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Order Date</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : '-'}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Total Quantity</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.totalQuantity || selectedOrder.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Total Price</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">${Number(selectedOrder.totalPrice || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Order items</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.orderItems?.length || 0} item(s)</p>
                                </div>
                                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[selectedOrder.status] || 'bg-slate-100 text-slate-800'}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm text-slate-700">
                                    <thead className="border-b border-slate-200 bg-white">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-500">Product</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Category</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Qty</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Unit</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {selectedOrder.orderItems?.map((item) => (
                                            <tr key={item.product}>
                                                <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                                                <td className="px-4 py-4 text-slate-500">{item.categoryName || item.category || 'Uncategorized'}</td>
                                                <td className="px-4 py-4">{item.quantity}</td>
                                                <td className="px-4 py-4">${item.unitPrice.toFixed(2)}</td>
                                                <td className="px-4 py-4 font-semibold text-slate-900">${item.totalPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">Status</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">{selectedOrder.status}</span>
                                    {isAdmin && (
                                        <select
                                            value={statusUpdate}
                                            onChange={(e) => setStatusUpdate(e.target.value)}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            {ORDER_STATUSES.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {statusMessage && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                    {statusMessage}
                                </div>
                            )}

                            {isAdmin && (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSaveStatus}
                                        disabled={statusLoading}
                                        className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
                                    >
                                        {statusLoading ? 'Updating...' : 'Update status'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeOrderDetails}
                                        className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;