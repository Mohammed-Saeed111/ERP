import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig.js';

const CustomerProducts = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [filterProducts, setFilterProducts] = useState([]);

    const [openModel, setOpenModel] = useState(false);
    const [orderData, setOrderData] = useState({
        productID: '',
        quantity: 1,
        total: 0,
        stock: 0,
        price: 0
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/api/products');
            if (response.data.success) {
                setCategories(response.data.categories);
                setProducts(response.data.products);
                setFilterProducts(response.data.products);
            }
        } catch (error) {
            console.error("Error fetching products", error.response?.data || error.message);
            alert(error.response?.data?.message || 'Unable to fetch products. Please login again.');
        }
    };

    const handleChangeCategory = (e) => {
        const categoryId = e.target.value;

        if (!categoryId) {
            setFilterProducts(products);
            return;
        }

        const filtered = products.filter(
            (product) => product.category?._id === categoryId
        );
        setFilterProducts(filtered);
    };

    const handleSearch = (e) => {
        const searchText = e.target.value.toLowerCase();

        const searched = products.filter(
            (product) => product.name.toLowerCase().includes(searchText)
        );

        setFilterProducts(searched);
    };

    const handleOrderChange = (product) => {
        if (product.stock <= 0) {
            alert('This product is out of stock');
            return;
        }

        setOrderData({
            productID: product._id,
            quantity: 1,
            total: product.price,
            stock: product.stock,
            price: product.price
        });
        setOpenModel(true);
    };

    const closeModel = () => {
        setOpenModel(false);
    };

    const increaseQuantity = (e) => {
        const newQuantity = parseInt(e.target.value);

        if (newQuantity < 1) return;

        if (newQuantity > orderData.stock) {
            alert("Not enough stock");
            return;
        }

        setOrderData((prev) => ({
            ...prev,
            quantity: newQuantity,
            total: newQuantity * prev.price
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/api/orders/add', orderData);

            if (response.data.success) {
                setOpenModel(false);
                setOrderData({
                    productID: '',
                    quantity: 1,
                    total: 0,
                    stock: 0,
                    price: 0
                });
                alert("Order added successfully");
            }
        } catch (error) {
            console.error(error.response?.data || error.message);
            alert(error.response?.data?.message || "Server error in adding order");
        }
    };

    return (
        <div className="p-4">

            {/* Header */}
            <div className="font-bold text-xl mb-4">Products</div>

            {/* Filters */}
            <div className="py-4 px-6 flex justify-between items-center bg-white rounded shadow">
                <select
                    onChange={handleChangeCategory}
                    className="bg-white border p-2 rounded w-1/3"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Search products..."
                    className="p-2 border rounded w-1/3"
                    onChange={handleSearch}
                />
            </div>

            {/* Table */}
            <div className="mt-4 bg-white shadow rounded overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border-b">ID</th>
                            <th className="p-3 border-b">Name</th>
                            <th className="p-3 border-b">Category</th>
                            <th className="p-3 border-b">Price</th>
                            <th className="p-3 border-b">Stock</th>
                            <th className="p-3 border-b">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filterProducts.length > 0 ? (
                            filterProducts.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{product._id}</td>
                                    <td className="p-3 border-b">{product.name}</td>
                                    <td className="p-3 border-b">
                                        {product.category?.name}
                                    </td>
                                    <td className="p-3 border-b">{product.price}</td>
                                    <td className="p-3 border-b">{product.stock}</td>
                                    <td className="p-3 border-b">
                                        <button
                                            onClick={() => handleOrderChange(product)}
                                            disabled={product.stock <= 0}
                                            className={`px-3 py-1 rounded text-white ${product.stock > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                        >
                                            {product.stock > 0 ? 'Order' : 'Out of stock'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-4">
                                    No records
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {openModel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white p-6 rounded w-96 shadow-lg">

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Place Order</h2>
                            <button onClick={closeModel} className="text-red-500 font-bold">
                                X
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <label className="block mb-2">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={orderData.quantity}
                                onChange={increaseQuantity}
                                className="w-full p-2 border rounded mb-4"
                            />

                            <p className="mb-4 font-semibold">
                                Total: {orderData.quantity * orderData.price} $
                            </p>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={closeModel}
                                    className="bg-gray-500 text-white px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-4 py-2 rounded"
                                >
                                    Confirm
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CustomerProducts;