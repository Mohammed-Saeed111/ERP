import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true
  },
  categoryDescription: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const CategoryModel = mongoose.model('Category', categorySchema);

export default CategoryModel;