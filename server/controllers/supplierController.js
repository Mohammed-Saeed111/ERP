import Supplier from '../models/Supplier.js';
import ProductModel from '../models/Product.js';

export const addSupplier = async (req, res) => {
  try {
    const { name, email, number, address } = req.body;

    if (!name || !email || !number) {
      return res.status(400).json({ success: false, message: 'name, email and number are required' });
    }

    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(409).json({ success: false, message: 'supplier already exists' });
    }

    const supplier = new Supplier({ name, email, number, address });
    await supplier.save();

    return res.json({ success: true, message: 'supplier added successfully', supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'server error' });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    return res.json({ success: true, suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'server error' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, number, address } = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { name, email, number, address },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ success: false, message: 'supplier not found' });
    }

    return res.json({ success: true, message: 'supplier updated successfully', supplier: updatedSupplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'server error' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).json({ success: false, message: 'supplier not found' });
    }

    return res.json({ success: true, message: 'supplier deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'server error' });
  }
};
