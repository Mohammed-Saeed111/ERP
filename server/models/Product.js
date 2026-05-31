import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number,
    required: true,
    min: 0
  },
  stock: { 
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier'
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;