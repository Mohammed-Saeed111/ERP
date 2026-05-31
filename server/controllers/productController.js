import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';

export const getProducts = async (req, res) => {
  try {
    const categories = await Category.find();
    const suppliers = await Supplier.find();
    
    const products = await Product.find({ isDeleted: false })
      .populate('categoryId')
      .populate('supplierId');
      
    return res.status(200).json({ 
      success: true, 
      products, 
      categories, 
      suppliers 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching records", error });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, supplierId } = req.body;
    
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      categoryId,
      supplierId
    });
    
    await newProduct.save();
    
    return res.status(200).json({ success: true, message: "Product added successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error adding product", error });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId, supplierId } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      id, 
      { name, description, price, stock, categoryId, supplierId }, 
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: "product not found" });
    }
    
    return res.status(200).json({ success: true, message: "product updated successfully", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error updating product", error });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "product not found" });
    }
    
    if (product.isDeleted) {
      return res.status(400).json({ success: false, message: "Product already deleted" });
    }
    
    await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    
    return res.status(200).json({ success: true, message: "product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error deleting product", error });
  }
};