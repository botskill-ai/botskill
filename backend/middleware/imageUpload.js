const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录（在项目根目录下的 uploads/images）
const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `blog-image-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（JPG、PNG、GIF、WEBP）'));
    }
  },
});

module.exports = { imageUpload };
