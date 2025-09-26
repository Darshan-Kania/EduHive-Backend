
const Bookmark = require('../models/Bookmark');
const Category = require('../models/Category');

exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id });
    res.json(bookmarks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createBookmark = async (req, res) => {
  const { title, url, notes, category, filePath } = req.body;

  // Make URL optional - validate only if provided
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  if (url && url.trim() !== '' && !urlRegex.test(url)) {
    return res.status(400).json({ msg: 'Invalid URL format' });
  }

  // Ensure at least URL or filePath is provided
  if ((!url || url.trim() === '') && (!filePath || filePath.trim() === '')) {
    return res.status(400).json({ msg: 'Either URL or file must be provided' });
  }

  try {
    const newBookmark = new Bookmark({
      title,
      url: url || '', // Default to empty string if not provided
      notes,
      category,
      filePath,
      user: req.user.id,
    });

    const bookmark = await newBookmark.save();
    res.json(bookmark);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateBookmark = async (req, res) => {
  const { title, url, notes, category, filePath } = req.body;

  // Make URL optional - validate only if provided
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  if (url && url.trim() !== '' && !urlRegex.test(url)) {
    return res.status(400).json({ msg: 'Invalid URL format' });
  }

  try {
    let bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) return res.status(404).json({ msg: 'Bookmark not found' });

    if (bookmark.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    bookmark = await Bookmark.findByIdAndUpdate(
      req.params.id,
      { $set: { title, url, notes, category, filePath } },
      { new: true }
    );

    res.json(bookmark);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteBookmark = async (req, res) => {
  try {
    let bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) return res.status(404).json({ msg: 'Bookmark not found' });

    if (bookmark.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Bookmark.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Bookmark removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.searchBookmarks = async (req, res) => {
  try {
    const query = req.query.q;
    const bookmarks = await Bookmark.find({
      user: req.user.id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { category: { $in: await Category.find({ name: { $regex: query, $options: 'i' } }).distinct('_id') } },
      ],
    });
    res.json(bookmarks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPublicBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id).select('title notes url');
    if (!bookmark) {
      return res.status(404).json({ msg: 'Bookmark not found' });
    }
    res.json(bookmark);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Generate share code for a bookmark
exports.generateShareCode = async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);
    
    if (!bookmark) {
      return res.status(404).json({ msg: 'Bookmark not found' });
    }

    // Check if user owns this bookmark
    if (bookmark.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Generate unique share code
    const shareCode = Math.random().toString(36).substr(2, 10).toUpperCase();
    
    bookmark.shareCode = shareCode;
    await bookmark.save();

    res.json({ shareCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Clone a bookmark using share code
exports.cloneBookmark = async (req, res) => {
  try {
    const { shareCode, categoryId } = req.body;

    if (!shareCode) {
      return res.status(400).json({ msg: 'Share code is required' });
    }

    if (!categoryId) {
      return res.status(400).json({ msg: 'Category is required' });
    }

    // Find the original bookmark by share code
    const originalBookmark = await Bookmark.findOne({ shareCode});
    
    if (!originalBookmark) {
      return res.status(404).json({ msg: 'Invalid share code or bookmark not found' });
    }

    // Check if user already has this bookmark cloned
    const existingClone = await Bookmark.findOne({
      user: req.user.id,
      clonedFrom: originalBookmark._id
    });

    if (existingClone) {
      return res.status(400).json({ msg: 'You have already cloned this bookmark' });
    }

    // Create a cloned bookmark
    const clonedBookmark = new Bookmark({
      title: originalBookmark.title + ' (Cloned)',
      url: originalBookmark.url,
      notes: originalBookmark.notes,
      category: categoryId,
      filePath: originalBookmark.filePath,
      user: req.user.id,
      clonedFrom: originalBookmark._id,
      originalBookmark: originalBookmark.originalBookmark || originalBookmark._id
    });

    await clonedBookmark.save();
    res.json(clonedBookmark);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get bookmark by share code (for preview)
exports.getBookmarkByShareCode = async (req, res) => {
  try {
    const { shareCode } = req.params;
    
    const bookmark = await Bookmark.findOne({ shareCode })
      .populate('category', 'name')
      .populate('user', 'name');
    
    if (!bookmark) {
      return res.status(404).json({ msg: 'Bookmark not found or not public' });
    }

    res.json({
      title: bookmark.title,
      notes: bookmark.notes,
      url: bookmark.url,
      category: bookmark.category.name,
      createdBy: bookmark.user.name,
      hasFile: !!bookmark.filePath
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
