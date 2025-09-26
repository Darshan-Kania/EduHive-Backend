
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

router.route('/').get(auth, getCategories).post(auth, createCategory);
router
  .route('/:id')
  .put(auth, updateCategory)
  .delete(auth, deleteCategory);

module.exports = router;
