
const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    nnrequired: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
    default: '',
  },
  notes: {
    type: String,
  },
  filePath: {
    type: String,
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  originalBookmark: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookmark',
  },
  clonedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookmark',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bookmark', BookmarkSchema);
