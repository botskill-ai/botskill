const crypto = require('crypto');

// 存储验证码的临时缓存（生产环境建议使用 Redis）
const captchaStore = new Map();

// 验证码过期时间（5分钟）
const CAPTCHA_EXPIRES = 5 * 60 * 1000;

// 生成随机验证码（4位数字+字母混合）
const generateCaptchaText = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除容易混淆的字符
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 生成验证码
const generateCaptcha = (req, res) => {
  try {
    // 生成唯一ID
    const captchaId = crypto.randomBytes(16).toString('hex');
    
    // 生成验证码文本
    const captchaText = generateCaptchaText();

    // 存储验证码（小写，便于验证）
    captchaStore.set(captchaId, {
      text: captchaText.toLowerCase(),
      expiresAt: Date.now() + CAPTCHA_EXPIRES
    });

    // 清理过期验证码
    cleanupExpiredCaptchas();

    res.json({
      success: true,
      data: {
        captchaId,
        text: captchaText, // 返回文本，前端使用 canvas 渲染
      }
    });
  } catch (error) {
    console.error('Error generating captcha:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate captcha'
    });
  }
};

// 验证验证码
const verifyCaptcha = (captchaId, userInput) => {
  if (!captchaId || !userInput) {
    return false;
  }

  const captcha = captchaStore.get(captchaId);
  
  if (!captcha) {
    return false;
  }

  // 检查是否过期
  if (Date.now() > captcha.expiresAt) {
    captchaStore.delete(captchaId);
    return false;
  }

  // 验证（不区分大小写）
  const isValid = captcha.text.toLowerCase() === userInput.toLowerCase().trim();
  
  // 验证后删除（一次性使用）
  if (isValid) {
    captchaStore.delete(captchaId);
  }

  return isValid;
};

// 清理过期验证码
const cleanupExpiredCaptchas = () => {
  const now = Date.now();
  for (const [id, captcha] of captchaStore.entries()) {
    if (now > captcha.expiresAt) {
      captchaStore.delete(id);
    }
  }
};

// 定期清理过期验证码（每10分钟）
setInterval(cleanupExpiredCaptchas, 10 * 60 * 1000);

module.exports = {
  generateCaptcha,
  verifyCaptcha
};
