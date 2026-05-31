import mongoose from 'mongoose';
import Category from '../models/Category.js';
import ProductModel from '../models/Product.js';

export const addCategory = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;

    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.json({ success: false, message: "category already exist" });
    }

    const newCategory = new Category({ categoryName, categoryDescription });
    await newCategory.save();

    return res.json({ success: true, message: "category added successfully" });
  } catch (error) {
    return res.json({ success: false, message: "server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.json({ success: true, categories });
  } catch (error) {
    return res.json({ success: false, message: "server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, categoryDescription } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(id, {
      categoryName,
      categoryDescription
    });

    if (!updatedCategory) {
      return res.json({ success: false, message: "category not found" });
    }

    return res.json({ success: true, message: "category updated successfully" });
  } catch (error) {
    return res.json({ success: false, message: "server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const productExists = await ProductModel.exists({ categoryId: id });

    if (productExists) {
      return res.status(400).json({ success: false, message: "Cannot delete category with associated products" });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: "category not found" });
    }

    return res.status(200).json({ success: true, message: "category deleted successfully" });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, message: error.message || "server error" });
  }
};