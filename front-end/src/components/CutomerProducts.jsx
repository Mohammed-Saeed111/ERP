import { useState, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiShoppingCart,
  FiBox,
  FiTag,
  FiPlus,
  FiMinus,
  FiX,
  FiRefreshCcw
} from 'react-icons/fi';
import api from '../utils/axiosConfig.js';

const CustomerProducts = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState({
    productID: '',
    name: '',
    price: 0,
    stock: 0,
    quantity: 1,
    total: 0
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      if (response.data.success) {
        setProducts(response.data.products || []);
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error loading products:', error.response?.data || error.message);
      setToast({ type: 'error', message: 'Unable to load products. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredProducts = useMemo(() => {
    let current = products;

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      current = current.filter((product) => {
        const categoryName =
          product.category?.name || product.categoryId?.categoryName || product.categoryId?.name || '';
        return (
          product.name?.toLowerCase().includes(lowerSearch) ||
          String(product.price).toLowerCase().includes(lowerSearch) ||
          categoryName.toLowerCase().includes(lowerSearch)
        );
      });
    }

    if (selectedCategory) {
      current = current.filter(
        (product) =>
          product.category?._id === selectedCategory ||
          product.categoryId === selectedCategory ||
          product.categoryId?._id === selectedCategory
      );
    }

    return current;
  }, [products, searchTerm, selectedCategory]);

  const summary = useMemo(
    () => ({
      totalProducts: products.length,
      availableProducts: products.filter((product) => Number(product.stock) > 0).length,
      categoryCount: categories.length
    }),
    [products, categories]
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleChangeCategory = (event) => {
    setSelectedCategory(event.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const handleOrderChange = (product) => {
    const price = Number(product.price) || 0;
    const stock = Number(product.stock) || 0;

    setOrderData({
      productID: product._id,
      name: product.name || '',
      price,
      stock,
      quantity: 1,
      total: price
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setOrderData((prev) => ({
      ...prev,
      quantity: 1,
      total: prev.price
    }));
  };

  const changeQuantity = (delta) => {
    setOrderData((prev) => {
      const nextQuantity = Math.min(Math.max(prev.quantity + delta, 1), prev.stock || 1);
      return {
        ...prev,
        quantity: nextQuantity,
        total: nextQuantity * prev.price
      };
    });
  };

  const handleQuantityInput = (event) => {
    const nextQuantity = Number(event.target.value) || 1;
    const clampedQuantity = Math.min(Math.max(nextQuantity, 1), orderData.stock || 1);
    setOrderData((prev) => ({
      ...prev,
      quantity: clampedQuantity,
      total: clampedQuantity * prev.price
    }));
  };

  const handleSubmit = async () => {
    if (!orderData.productID) return;

    try {
      setSubmitting(true);
      const response = await api.post('/api/orders/add', {
        productID: orderData.productID,
        quantity: orderData.quantity,
        total: orderData.total
      });

      if (response.data.success) {
        setToast({ type: 'success', message: response.data.message || 'Order placed successfully.' });
        closeModal();
        fetchProducts();
      } else {
        setToast({ type: 'error', message: response.data.message || 'Unable to place order.' });
      }
    } catch (error) {
      console.error('Order submit error:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'An error occurred while placing the order.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-sky-600">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100">
              <FiBox className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Products</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100">
              <FiTag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Available</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.availableProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-violet-600">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100">
              <FiShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Categories</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.categoryCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Customer Products</h2>
          <p className="mt-1 text-sm text-slate-500">Browse inventory and place orders directly from the customer panel.</p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FiRefreshCcw className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 text-slate-900">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <FiSearch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Filters</h3>
              <p className="text-sm text-slate-500">Search by name or category.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search products..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={handleChangeCategory}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name || cat.categoryName || 'Unnamed category'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Product list</h3>
                <p className="text-sm text-slate-500">{filteredProducts.length} product(s) found</p>
              </div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Stock</span>
                <span className="ml-2 text-slate-500">{summary.availableProducts} available</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium">Product</th>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium">Category</th>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium">Price</th>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium">Stock</th>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">Loading products...</td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-3xl bg-slate-100 text-slate-600">
                            <FiBox className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-500">{product._id?.slice(-6) || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-600">{product.category?.name || product.categoryId?.categoryName || product.categoryId?.name || 'Uncategorized'}</td>
                      <td className="px-6 py-5 text-slate-900">${Number(product.price).toFixed(2)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${Number(product.stock) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => handleOrderChange(product)}
                          disabled={Number(product.stock) <= 0}
                          className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${Number(product.stock) > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">No products match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {toast && (
        <div className={`mb-6 rounded-3xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {toast.message}
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">New order</p>
                <h3 className="text-2xl font-semibold text-slate-900">{orderData.name}</h3>
              </div>
              <button onClick={closeModal} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Unit price</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">${orderData.price.toFixed(2)}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Quantity</span>
                  <span>Stock {orderData.stock}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-1">
                  <button type="button" onClick={() => changeQuantity(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                    <FiMinus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={orderData.stock}
                    value={orderData.quantity}
                    onChange={handleQuantityInput}
                    className="w-full rounded-2xl border-none bg-transparent text-center text-lg font-semibold text-slate-900 outline-none"
                  />
                  <button type="button" onClick={() => changeQuantity(1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                    <FiPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Total</span>
                  <span className="text-xl font-semibold text-slate-900">${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-3xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Placing order...' : 'Confirm order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProducts;
