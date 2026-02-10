const express = require('express');
const { generateCaptcha } = require('../controllers/captchaController');

const router = express.Router();

// 生成验证码（公开接口，无需认证）
router.get('/generate', generateCaptcha);

module.exports = router;
