const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const uploadDir = path.join(os.tmpdir(), 'botskill-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `skill-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const ok = name.endsWith('.zip') || name.endsWith('.tar.gz') || name.endsWith('.md') || name.endsWith('.gz');
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip, .tar.gz, .md files are allowed'));
    }
  },
});

module.exports = { upload };
