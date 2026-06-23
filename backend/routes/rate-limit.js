// 简易内存限流器（无需 npm 依赖）
const rateLimit = {};

module.exports = function rateLimiter(opts) {
  const windowMs = opts.windowMs || 60 * 1000;  // 默认 1 分钟
  const max = opts.max || 100;                   // 默认 100 次/分钟
  
  return function(req, res, next) {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimit[key]) {
      rateLimit[key] = [];
    }
    
    // 清理过期的记录
    rateLimit[key] = rateLimit[key].filter(t => now - t < windowMs);
    
    if (rateLimit[key].length >= max) {
      return res.status(429).json({ 
        error: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    rateLimit[key].push(now);
    next();
  };
};
