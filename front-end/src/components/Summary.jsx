import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../utils/axiosConfig';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CSVLink } from 'react-csv';
import toast, { Toaster } from 'react-hot-toast';

const Summary = () => {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenue: 0,
    outOfStock: [],
    highestSaleProduct: null,
    lowStock: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allOrders, setAllOrders] = useState([]);

  const navigate = useNavigate();

  const format = (value, currency = false) => {
    if (currency) return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
    return new Intl.NumberFormat().format(value);
  };

  const computeTopProducts = (orders = []) => {
    const map = {};
    for (const o of orders) {
      const name = o.product?.name || 'Unknown';
      map[name] = (map[name] || 0) + (o.quantity || 0);
    }
    const list = Object.entries(map).map(([name, qty]) => ({ name, qty }));
    list.sort((a, b) => b.qty - a.qty);
    return list.slice(0, 5);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/orders')
      ]);

      if (dashRes.data?.success) setDashboardData(dashRes.data.dashboardData || {});
      if (ordersRes.data?.success) {
        const orders = ordersRes.data.orders || [];
        // keep all orders for analytics, and recent slice for quick view
        setAllOrders(orders);
        const recent = orders.slice().sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 6);
        setRecentOrders(recent);
        setTopProducts(computeTopProducts(orders));
      }
    } catch (error) {
      console.error('Dashboard fetch error', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!polling) return undefined;
    const id = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(id);
  }, [polling, fetchDashboardData]);

  const filterByDateRange = (orders) => {
    if (!startDate || !endDate) return orders;
    return orders.filter((o) => {
      const d = new Date(o.orderDate);
      return d >= startDate && d <= endDate;
    });
  };

  const revenueSeries = useMemo(() => {
    const orders = filterByDateRange(allOrders || []);
    const map = {};
    for (const o of orders) {
      const d = new Date(o.orderDate);
      const key = d.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + (o.totalPrice || 0);
    }
    const items = Object.entries(map).map(([date, value]) => ({ date, revenue: value }));
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items;
  }, [allOrders, startDate, endDate]);

  const Card = ({ title, value, color = 'bg-white' }) => (
    <div className={`rounded-2xl shadow-md p-5 transition hover:shadow-xl hover:-translate-y-1 ${color}`}>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
    </div>
  );

  Card.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-sm text-slate-500 max-w-2xl">
          Business metrics, inventory status, revenue trends, and order activity in one place.
        </p>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition">Add Product</button>
          <button onClick={() => navigate('/admin/categories')} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100 transition">Create Category</button>
          <button onClick={() => navigate('/admin/suppliers')} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100 transition">Create Supplier</button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => fetchDashboardData()} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100 transition">Refresh</button>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={polling} onChange={(e) => setPolling(e.target.checked)} className="h-4 w-4 accent-blue-600" /> Polling
          </label>
        </div>
      </div>

      {loading && (
        <div className="text-gray-500 mb-4">Loading data...</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card title="Total Products" value={format(dashboardData.totalProducts)} />
        <Card title="Total Stock" value={format(dashboardData.totalStock)} color="bg-green-50" />
        <Card title="Orders Today" value={format(dashboardData.ordersToday)} color="bg-yellow-50" />
        <Card title="Revenue" value={format(dashboardData.revenue || 0, true)} color="bg-purple-50" />
      </div>

      <Toaster />

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Revenue trends</h4>
            <p className="text-sm text-slate-500">Track revenue over time with the current date range.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col text-xs text-slate-500">
                From
                <input type="date" className="mt-1 rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm" value={startDate ? startDate.toISOString().slice(0,10) : ''} onChange={(e)=> setStartDate(e.target.value ? new Date(e.target.value) : null)} />
              </label>
              <label className="flex flex-col text-xs text-slate-500">
                To
                <input type="date" className="mt-1 rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm" value={endDate ? endDate.toISOString().slice(0,10) : ''} onChange={(e)=> setEndDate(e.target.value ? new Date(e.target.value) : null)} />
              </label>
            </div>
            <button onClick={() => { setStartDate(null); setEndDate(null); }} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">Clear</button>
          </div>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {revenueSeries.length === 0 ? (
            <div className="text-sm text-slate-500">No revenue data for selected range.</div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => format(value, true)} contentStyle={{ borderRadius: '0.75rem' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Out of Stock</h3>
          {dashboardData.outOfStock.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.outOfStock.map((p) => (
                <li key={p._id} className="text-sm text-slate-700">{p.name} <span className="text-xs text-slate-400">({p.stock})</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No products out of stock</p>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Top Selling Product</h3>

          {dashboardData.highestSaleProduct?.name ? (
            <div className="text-gray-700">
              <p className="font-medium">{dashboardData.highestSaleProduct.name}</p>
              <p className="text-sm text-slate-500">{dashboardData.highestSaleProduct.category}</p>
              <p className="text-sm text-slate-600 mt-2">Sold: {dashboardData.highestSaleProduct.totalQuantity}</p>
            </div>
          ) : dashboardData.highestSaleProduct?.message ? (
            <p className="text-gray-500">{dashboardData.highestSaleProduct.message}</p>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}

          {topProducts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Top products (from orders)</h4>
              <ol className="list-decimal list-inside text-sm text-slate-700">
                {topProducts.map((t) => (
                  <li key={t.name}>{t.name} — {t.qty}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Low Stock</h3>
          {dashboardData.lowStock.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.lowStock.map((p) => (
                <li key={p._id} className="text-sm text-slate-700">{p.name} <span className="text-xs text-slate-400">({p.stock})</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No low stock products</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
              <p className="text-sm text-slate-500">Latest orders with quantity, date, and sales value.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => navigate('/admin/orders')} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">View all</button>
              <CSVLink
                data={filterByDateRange(allOrders)}
                filename={`orders-${new Date().toISOString().slice(0,10)}.csv`}
                className="rounded-full border border-blue-600 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition"
              >
                Export CSV
              </CSVLink>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-xs text-slate-500">
              Start date
              <input type="date" className="mt-1 rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm" value={startDate ? startDate.toISOString().slice(0,10) : ''} onChange={(e)=> setStartDate(e.target.value ? new Date(e.target.value) : null)} />
            </label>
            <label className="flex flex-col text-xs text-slate-500">
              End date
              <input type="date" className="mt-1 rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm" value={endDate ? endDate.toISOString().slice(0,10) : ''} onChange={(e)=> setEndDate(e.target.value ? new Date(e.target.value) : null)} />
            </label>
          </div>

          {(!allOrders || allOrders.length === 0) ? (
            <p className="text-sm text-slate-500">No recent orders</p>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Product</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Revenue</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filterByDateRange(allOrders).slice().sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate)).slice(0,10).map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{o.product?.name || 'Product'}</td>
                      <td className="px-4 py-3 text-slate-600">{o.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{format(o.totalPrice || 0, true)}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.orderDate).toLocaleDateString()} {new Date(o.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Quick Stats</h3>
            <button onClick={() => fetchDashboardData()} className="text-sm text-blue-600 hover:underline">Refresh</button>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <div>Total Products: <strong>{format(dashboardData.totalProducts)}</strong></div>
            <div>Total Stock: <strong>{format(dashboardData.totalStock)}</strong></div>
            <div>Orders Today: <strong>{format(dashboardData.ordersToday)}</strong></div>
            <div>Revenue: <strong>{format(dashboardData.revenue || 0, true)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;