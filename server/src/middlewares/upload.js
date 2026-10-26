const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Session 8: multer keeps the file in memory; the controller streams it to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new ApiError(400, 'Only image files (JPG, PNG, WebP, GIF) can be uploaded'));
  },
});

module.exports = upload;
