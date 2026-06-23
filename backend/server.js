const express = require('express');
const path = require('path');
const { router: usersRouter } = require('./routes/users');
const creatorsRouter = require('./routes/creators');
const referralsRouter = require('./routes/referrals');
const adminRouter = require('./routes/admin');
const worksRouter = require('./routes/works');
const contentRouter = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
// 接口限流
const rateLimiter = require('./routes/rate-limit');
app.use('/api/', rateLimiter({ windowMs: 60000, max: 120 }));
app.use(express.json());
app.use('/api', usersRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/works', worksRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api', adminRouter);
app.use('/api/content', contentRouter);
app.use(express.static(path.join(__dirname, '..'), { maxAge: 0, etag: true, lastModified: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'assets'), { maxAge: '7d', etag: true }));
app.use('/apply', express.static(path.join(__dirname, '..', 'vacat_apply_site')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 全局错误处理中间件
app.use(function(err, req, res, next) {
  console.error("\n[ERROR]", new Date().toISOString(), req.method, req.path);
  console.error(err.stack || err.message || err);
  res.status(500).json({ error: "服务器内部错误" });
});

// 请求日志（非静态资源）
app.use(function(req, res, next) {
  if (!req.path.startsWith("/assets/") && !req.path.startsWith("/css/") && !req.path.startsWith("/js/")) {
    console.log("[" + new Date().toLocaleTimeString() + "]", req.method, req.path);
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=== AI视觉创作者部落 后端已启动 ===');
  console.log('地址: http://localhost:' + PORT);
  console.log('管理后台: http://localhost:' + PORT + '/admin/');
});
