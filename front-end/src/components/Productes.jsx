import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig.js';

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    supplierId: ''
  });


  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      if (response.data.success) {
        setProducts(response.data.products || []);
        setFilteredProducts(response.data.products || []);
        setCategories(response.data.categories || []);
        setSuppliers(response.data.suppliers || []);
        console.log('✓ Data fetched successfully', {
          productsCount: response.data.products?.length,
          categoriesCount: response.data.categories?.length,
          suppliersCount: response.data.suppliers?.length,
        });
      }
    } catch (error) {
      console.error('✗ Error fetching products:', error.response?.data || error.message);
      alert('Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    const filtered = products.filter((product) => {
      const categoryName = product.categoryId?.categoryName || product.categoryId?.name || '';
      const supplierName = product.supplierId?.name || '';
      return (
        product.name.toLowerCase().includes(value) ||
        product.description?.toLowerCase().includes(value) ||
        categoryName.toLowerCase().includes(value) ||
        supplierName.toLowerCase().includes(value)
      );
    });
    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editProduct) {
        await api.put(`/api/products/${editProduct._id}`, formData);
        alert('✓ Product updated successfully');
      } else {
        await api.post('/api/products/add', formData);
        alert('✓ Product added successfully');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error processing request';
      alert(`✗ ${errorMsg}`);
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      categoryId: product.categoryId?._id || '',
      supplierId: product.supplierId?._id || ''
    });
    setEditProduct(product);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل ترغب بحذف هذا المنتج؟')) return;
    try {
      await api.delete(`/api/products/${id}`);
      alert('✓ Product deleted successfully');
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error deleting product';
      alert(`✗ ${errorMsg}`);
      console.error('Delete error:', error);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      supplierId: ''
    });
  };

  const stockBadge = (stock) => {
    if (stock === 0) return 'bg-rose-500 text-white';
    if (stock < 5) return 'bg-amber-400 text-slate-900';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-4xl bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Product Management</h2>
              <p className="mt-2 text-sm text-slate-500">ادارة المنتجات بالكامل: عرض، بحث، اضافة، تعديل، حذف.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={handleSearch}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-80"
              />
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-4xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading products...</div>
          ) : !filteredProducts?.length ? (
            <div className="p-10 text-center text-slate-500">لا توجد منتجات بعد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredProducts.map((product, index) => (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{product.categoryId?.categoryName || product.categoryId?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{product.supplierId?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">${product.price}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockBadge(product.stock)}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editProduct ? 'Edit Product' : 'Add Product'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Fill the fields and save the product.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Product Name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Product name"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Price
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Product price"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 col-span-full">
                  Description
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Product description"
                    className="h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Stock
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Stock quantity"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Category
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.categoryName || category.name || 'Unnamed Category'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Supplier
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;