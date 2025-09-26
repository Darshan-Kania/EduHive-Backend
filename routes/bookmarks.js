
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getPublicBookmark,
  searchBookmarks,
  generateShareCode,
  cloneBookmark,
  getBookmarkByShareCode,
} = require('../controllers/bookmarkController');

router.route('/').get(auth, getBookmarks).post(auth, createBookmark);
router.route('/search').get(auth, searchBookmarks);
router
  .route('/:id')
  .put(auth, updateBookmark)
  .delete(auth, deleteBookmark);

router.get('/public/:id', getPublicBookmark);
router.post('/:id/share', auth, generateShareCode);
router.post('/clone', auth, cloneBookmark);
router.get('/share/:shareCode', getBookmarkByShareCode);

module.exports = router;
