const cloudinary = require('cloudinary').v2;

// Session 8: Cloudinary is optional - the app runs without it and uploads return 503
const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Upload a buffer (from multer memory storage) via an upload stream
const uploadBuffer = (buffer, folder = 'hirely/avatars') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const deleteImage = (publicId) => (publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve());

module.exports = { cloudinary, isCloudinaryConfigured, uploadBuffer, deleteImage };
