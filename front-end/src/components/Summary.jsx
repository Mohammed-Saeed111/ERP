import  { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const Summary = () => {
  const [loading, setLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenue: 0,
    outOfStock: [],
    highestSaleProduct: null,
    lowStock: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('POS_token');

      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDashboardData(response.data.dashboardData);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const Card = ({ title, value, color = "bg-white" }) => (
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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {loading && (
        <div className="text-gray-500 mb-4">Loading data...</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card title="Total Products" value={dashboardData.totalProducts} />
        <Card title="Total Stock" value={dashboardData.totalStock} color="bg-green-50" />
        <Card title="Orders Today" value={dashboardData.ordersToday} color="bg-yellow-50" />
        <Card title="Revenue" value={`$${dashboardData.revenue}`} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Out of Stock</h3>
          {dashboardData.outOfStock.length > 0 ? (
            <p className="text-gray-500">Data available to map...</p>
          ) : (
            <p className="text-gray-400">No products out of stock</p>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Highest Sale</h3>

          {dashboardData.highestSaleProduct?.name ? (
            <div className="text-gray-700">
              <p className="font-medium">
                {dashboardData.highestSaleProduct.name}
              </p>
            </div>
          ) : dashboardData.highestSaleProduct?.message ? (
            <p className="text-gray-500">{dashboardData.highestSaleProduct.message}</p>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-md p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Low Stock</h3>
          {dashboardData.lowStock.length > 0 ? (
            <p className="text-gray-500">Data available to map...</p>
          ) : (
            <p className="text-gray-400">No low stock products</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;