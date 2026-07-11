import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig.js';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];
const UPDATABLE_STATUSES = ORDER_STATUSES.filter((s) => s !== 'Canceled');
const STATUS_STYLES = {
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Shipped: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Canceled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
};

const Orders = ({ initialStatus = '' }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [toast, setToast] = useState(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const controller = new AbortController();
        setStatusFilter(initialStatus);
        fetchOrders(controller.signal, { status: initialStatus });
        return () => controller.abort();
    }, [initialStatus]);

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
            if (fetchError.name === 'CanceledError' || fetchError.name === 'AbortError') return;
            setError(fetchError?.response?.data?.message || 'Unable to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => orders, [orders]);

    const paginatedOrders = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return orders.slice(start, start + PAGE_SIZE);
    }, [orders, page]);

    const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

    const summary = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
        const totalQuantity = filteredOrders.reduce((sum, o) => sum + Number(o.totalQuantity || o.orderItems?.reduce((a, i) => a + i.quantity, 0) || 0), 0);
        const averageOrder = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
        return { orderCount: filteredOrders.length, totalRevenue, totalQuantity, averageOrder };
    }, [filteredOrders]);

    const statusCounts = useMemo(() =>
        ORDER_STATUSES.reduce((acc, s) => { acc[s] = filteredOrders.filter((o) => o.status === s).length; return acc; }, {}),
        [filteredOrders]);

    const clearFilters = () => {
        setSearch(''); setStatusFilter(initialStatus); setStartDate(''); setEndDate(''); setPage(1);
        fetchOrders(new AbortController().signal, { search: '', status: initialStatus, startDate: '', endDate: '' });
    };

    const showToast = (type, message) => setToast({ type, message });

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 3500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const openOrderDetails = (order) => { setSelectedOrder(order); setStatusUpdate(order.status || 'Pending'); setStatusMessage(''); };
    const closeOrderDetails = () => { setSelectedOrder(null); setStatusMessage(''); };

    const handleCancelOrder = async (orderId) => {
        setStatusLoading(true); setStatusMessage('');
        try {
            const response = await api.patch(`/api/orders/${orderId}/cancel`);
            if (response.data.success) {
                showToast('success', 'Order canceled successfully.');
                setStatusMessage('Order canceled successfully.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                showToast('error', response.data.message || 'Failed to cancel order.');
                setStatusMessage(response.data.message || 'Failed to cancel order.');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Error canceling order.';
            showToast('error', message); setStatusMessage(message);
        } finally { setStatusLoading(false); }
    };

    const handleRestoreOrder = async (orderId) => {
        setStatusLoading(true); setStatusMessage('');
        try {
            const response = await api.patch(`/api/orders/${orderId}/restore`);
            if (response.data.success) {
                showToast('success', 'Order restored successfully.');
                setStatusMessage('Order restored successfully.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                showToast('error', response.data.message || 'Failed to restore order.');
                setStatusMessage(response.data.message || 'Failed to restore order.');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Error restoring order.';
            showToast('error', message); setStatusMessage(message);
        } finally { setStatusLoading(false); }
    };

    const handleSaveStatus = async () => {
        if (!selectedOrder || !statusUpdate) return;
        setStatusLoading(true); setStatusMessage('');
        try {
            const response = await api.patch(`/api/orders/${selectedOrder._id}/status`, { status: statusUpdate });
            if (response.data.success) {
                showToast('success', 'Order status updated successfully.');
                setStatusMessage('Order status updated successfully.');
                fetchOrders(new AbortController().signal);
                setSelectedOrder(response.data.order);
            } else {
                const message = response.data.message || 'Failed to update status.';
                showToast('error', message); setStatusMessage(message);
            }
        } catch (error) {
            setStatusMessage(error.response?.data?.message || 'Error updating order status.');
        } finally { setStatusLoading(false); }
    };

    const exportCSV = (data) => {
        const headers = ['Order ID', 'Customer', 'Items', 'Total Qty', 'Total Price', 'Status', 'Date'];
        const rows = data.map((o) => [o._id, o.customer?.name || o.customer?.email || '-', o.orderItems?.map((i) => `${i.name} x${i.quantity}`).join(' | ') || '-', o.totalQuantity || 0, Number(o.totalPrice || 0).toFixed(2), o.status, o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '']);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="mb-6 flex flex-col gap-4 lg:items-center lg:justify-between lg:flex-row">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Orders</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View orders with quick performance summary.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 w-full lg:w-auto">
                    {[['Order Count', summary.orderCount], ['Total Revenue', `$${summary.totalRevenue.toFixed(2)}`], ['Total Quantity', summary.totalQuantity], ['Avg Order Value', `$${summary.averageOrder.toFixed(2)}`]].map(([label, val]) => (
                        <div key={label} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-4 text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{label}</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{val}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-4">
                    {[{ label: 'Search product or customer', type: 'text', value: search, onChange: (e) => setSearch(e.target.value), placeholder: 'Search orders...' },
                      { label: 'From', type: 'date', value: startDate, onChange: (e) => setStartDate(e.target.value) },
                      { label: 'To', type: 'date', value: endDate, onChange: (e) => setEndDate(e.target.value) }].map(({ label, ...props }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                            <input {...props} className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={Boolean(initialStatus)} className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                            {!initialStatus && <option value="">All statuses</option>}
                            {(initialStatus ? [initialStatus] : ORDER_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => fetchOrders(new AbortController().signal)} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">Refresh</button>
                    <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">Clear filters</button>
                </div>
            </div>

            {toast && <div className={`mb-4 rounded-3xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'}`}>{toast.message}</div>}
            {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    {ORDER_STATUSES.map((s) => (
                        <div key={s} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{s}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{statusCounts[s]}</p>
                        </div>
                    ))}
                </div>
                {orders.length > 0 && (
                    <button type="button" onClick={() => exportCSV(orders)} className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">Export CSV</button>
                )}
            </div>

            {!loading && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">#</th>
                                {isAdmin && <th className="p-3 border-b border-slate-200 dark:border-slate-600">Customer</th>}
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Products</th>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Qty</th>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Total</th>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Status</th>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Date</th>
                                <th className="p-3 border-b border-slate-200 dark:border-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.length > 0 ? paginatedOrders.map((order, index) => {
                                const status = order.status || 'Pending';
                                const canCancel = isAdmin ? ['Pending', 'Processing'].includes(status) : status === 'Pending';
                                const totalQuantity = order.totalQuantity || order.orderItems?.reduce((s, i) => s + i.quantity, 0) || 0;
                                const firstItem = order.orderItems?.[0];
                                const productLabel = firstItem ? `${firstItem.name}${order.orderItems?.length > 1 ? ` +${order.orderItems.length - 1} more` : ''}` : '-';
                                return (
                                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                                        <td className="p-3 text-slate-700 dark:text-slate-300">{(page - 1) * PAGE_SIZE + index + 1}</td>
                                        {isAdmin && <td className="p-3 text-slate-700 dark:text-slate-300">{order.customer?.name || order.customer?.email || '-'}</td>}
                                        <td className="p-3 text-slate-700 dark:text-slate-300">{productLabel}</td>
                                        <td className="p-3 text-slate-700 dark:text-slate-300">{totalQuantity}</td>
                                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">${Number(order.totalPrice || 0).toFixed(2)}</td>
                                        <td className="p-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Shipped}`}>{status}</span></td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400">{order.orderDate ? new Date(order.orderDate).toLocaleString() : '-'}</td>
                                        <td className="p-3 space-x-2">
                                            <button type="button" onClick={() => openOrderDetails(order)} className="rounded-full bg-slate-100 dark:bg-slate-600 px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500 transition">Details</button>
                                            {canCancel && <button type="button" onClick={() => handleCancelOrder(order._id)} className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-3 py-1 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition">Cancel</button>}
                                            {status === 'Canceled' && isAdmin && <button type="button" onClick={() => handleRestoreOrder(order._id)} className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition">Restore</button>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center p-4 text-slate-500 dark:text-slate-400">No orders to display</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Showing {Math.min((page - 1) * PAGE_SIZE + 1, orders.length)}–{Math.min(page * PAGE_SIZE, orders.length)} of {orders.length}</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Prev</button>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{page} / {totalPages}</span>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Next</button>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Order details</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">#{selectedOrder._id.slice(-6)}</h2>
                            </div>
                            <button type="button" onClick={closeOrderDetails} className="rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition">Close</button>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            {[['Customer', selectedOrder.customer?.name || '-', selectedOrder.customer?.email || ''],
                              ['Order Date', selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : '-'],
                              ['Total Quantity', selectedOrder.totalQuantity || selectedOrder.orderItems?.reduce((s, i) => s + i.quantity, 0) || 0],
                              ['Total Price', `$${Number(selectedOrder.totalPrice || 0).toFixed(2)}`]].map(([label, val, sub]) => (
                                <div key={label} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{val}</p>
                                    {sub && <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Order items</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedOrder.orderItems?.length || 0} item(s)</p>
                                </div>
                                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[selectedOrder.status] || STATUS_STYLES.Shipped}`}>{selectedOrder.status}</span>
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <tr>
                                            {['Product', 'Category', 'Qty', 'Unit', 'Total'].map((h) => (
                                                <th key={h} className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {selectedOrder.orderItems?.map((item) => (
                                            <tr key={item.product}>
                                                <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                                                <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{item.categoryName || item.category || 'Uncategorized'}</td>
                                                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">${item.unitPrice.toFixed(2)}</td>
                                                <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">${item.totalPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[selectedOrder.status] || STATUS_STYLES.Shipped}`}>{selectedOrder.status}</span>
                                    {isAdmin && (
                                        <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                            {UPDATABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            {statusMessage && <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-300">{statusMessage}</div>}
                            {isAdmin && (
                                <div className="flex flex-wrap gap-3">
                                    <button type="button" onClick={handleSaveStatus} disabled={statusLoading} className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60">{statusLoading ? 'Updating...' : 'Update status'}</button>
                                    <button type="button" onClick={closeOrderDetails} className="rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition">Close</button>
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
