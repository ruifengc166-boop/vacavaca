const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'vacat_jwt_secret_2026';
const router = require('express').Router();

// Simple admin auth check
function isAdmin(req, res, next) {
  const users = db.load('users');
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({error:'\u672a\u767b\u5f55'});
  try {
    var parts = h.split(' ')[1].split('.');
    if (parts.length !== 3) return res.status(401).json({error:'\u65e0\u6548\u51ed\u8bc1'});
    var sig = crypto.createHmac('sha256', JWT_SECRET).update(parts[0]+'.'+parts[1]).digest('base64url');
    if (sig !== parts[2]) return res.status(401).json({error:'token\u5df2\u7be1\u6539'});
    var p = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (p.exp < Date.now()) return res.status(401).json({error:'\u767b\u5f55\u5df2\u8fc7\u671f'});
    var u = users.find(function(usr){return usr.id===p.id&&usr.role==='admin';});
    if (!u) return res.status(403).json({error:'\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650'});
    req.userId = p.id;
    req.isAdmin = true;
    next();
  } catch(e) { res.status(401).json({error:'\u65e0\u6548\u51ed\u8bc1'}); }
}

// GET /api/admin/creators
router.get('/admin/creators', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  res.json(db.load('creators'));
});

// POST /api/admin/creators (create)
router.post('/admin/creators', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  const { name, avatar, level, specialty, status, bio, tags, works_count, likes } = req.body;
  if (!name) return res.status(400).json({ error: '名称不能为空' });
  const creators = db.load('creators');
  const id = creators.length > 0 ? Math.max(...creators.map(c => c.id)) + 1 : 1;
  creators.push({ id, name: name||'', avatar: avatar||name[0]||'?', level: level||'member', specialty: specialty||'', status: status||'active', bio: bio||'', tags: tags||'', works_count: works_count||0, likes: likes||0, created_at: new Date().toISOString() });
  db.save('creators', creators);
  res.json({ success: true, id });
});

// PUT /api/admin/creators/:id
router.put('/admin/creators/:id', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  let creators = db.load('creators');
  const idx = creators.findIndex(c => c.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: '创作者不存在' });
  const { name, avatar, level, specialty, status, bio, tags, works_count, likes } = req.body;
  Object.assign(creators[idx], { 
    name: name !== undefined ? name : creators[idx].name,
    avatar: avatar !== undefined ? avatar : creators[idx].avatar,
    level: level !== undefined ? level : creators[idx].level,
    specialty: specialty !== undefined ? specialty : creators[idx].specialty,
    status: status !== undefined ? status : creators[idx].status,
    bio: bio !== undefined ? bio : creators[idx].bio,
    tags: tags !== undefined ? tags : creators[idx].tags,
    works_count: works_count !== undefined ? works_count : creators[idx].works_count,
    likes: likes !== undefined ? likes : creators[idx].likes,
  });
  db.save('creators', creators);
  res.json({ success: true });
});

// DELETE /api/admin/creators/:id
router.delete('/admin/creators/:id', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  let creators = db.load('creators');
  creators = creators.filter(c => c.id != req.params.id);
  db.save('creators', creators);
  res.json({ success: true });
});

// Referrals
router.get('/admin/referrals', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  res.json(db.load('referrals').reverse());
});

// Users
router.get('/admin/users', isAdmin, (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
  const users = db.load('users').map(({password, ...u}) => u);
  res.json(users);
});


// Content management
router.get('/admin/content', isAdmin, (req, res) => {
  const db = require('../db');
  res.json(db.load('content'));
});

router.put('/admin/content', isAdmin, (req, res) => {
  const db = require('../db');
  const updates = req.body;
  if (!updates || typeof updates !== 'object') return res.status(400).json({error:'Invalid data'});
  let c = db.load('content');
  function merge(t,s){for(const k in s){if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])&&t[k])merge(t[k],s[k]);else t[k]=s[k];}}
  merge(c, updates);
  db.save('content', c);
  res.json({success:true});
});


// File upload endpoint
var UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
var uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, UPLOADS_DIR); },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2,8) + path.extname(file.originalname));
  }
});
var upload = multer({ storage: uploadStorage, limits: { fileSize: 50*1024*1024 } });

router.post('/admin/upload', isAdmin, upload.single('file'), function(req, res) {
  if (!req.file) return res.status(400).json({ error: '\u8bf7\u9009\u62e9\u6587\u4ef6' });
  res.json({ url: '/uploads/' + req.file.filename });
});


// Stats dashboard
router.get('/admin/stats', isAdmin, (req, res) => {
  var creators = db.load('creators');
  var works = db.load('works');
  var days = parseInt(req.query.days) || 7;
  if (days <= 0) days = 36500;
  var cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  var newCreators = creators.filter(function(c) {
    var t = new Date(c.created_at || 0).getTime();
    return t >= cutoff;
  });
  var works2nd = works.filter(function(w) { return w.edition === '第二届'; });
  var works1st = works.filter(function(w) { return w.edition === '第一届'; });
  res.json({ totalCreators: creators.length, newCreators: newCreators.length, works2nd: works2nd.length, works1st: works1st.length, totalWorks: works.length });
});

module.exports = router;


// ===== 精彩瞬间 (Moments) Management =====
var MOMENTS_DATA = path.join(__dirname, '..', 'data', 'moments.json');
var MOMENTS_DIR = path.join(__dirname, '..', '..', 'assets', 'moments');
if (!fs.existsSync(MOMENTS_DIR)) fs.mkdirSync(MOMENTS_DIR, { recursive: true });

// Public: GET /api/moments
router.get('/moments', (req, res) => {
  if (!fs.existsSync(MOMENTS_DATA)) return res.json([]);
  var data = JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8'));
  data.sort(function(a,b){return a.order - b.order;});
  res.json(data);
});

// Admin: GET /api/admin/moments
router.get('/admin/moments', isAdmin, (req, res) => {
  if (!fs.existsSync(MOMENTS_DATA)) return res.json([]);
  var data = JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8'));
  data.sort(function(a,b){return a.order - b.order;});
  res.json(data);
});

// Admin: POST /api/admin/moments/upload (upload file + create record)
var momentUpload = multer({ storage: multer.diskStorage({
  destination: function(req,file,cb){cb(null, MOMENTS_DIR);},
  filename: function(req,file,cb){
    cb(null, 'moment-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) + path.extname(file.originalname));
  }
}), limits: { fileSize: 50*1024*1024 } });

router.post('/admin/moments/upload', isAdmin, momentUpload.single('file'), function(req, res) {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  var moments = fs.existsSync(MOMENTS_DATA) ? JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8')) : [];
  var newId = moments.length > 0 ? Math.max.apply(null, moments.map(function(m){return m.id;})) + 1 : 1;
  var maxOrder = moments.length > 0 ? Math.max.apply(null, moments.map(function(m){return m.order;})) + 1 : 1;
  var newMoment = {
    id: newId,
    src: '/assets/moments/' + req.file.filename,
    title: req.body.title || '精彩瞬间 ' + newId,
    order: parseInt(req.body.order) || maxOrder
  };
  moments.push(newMoment);
  fs.writeFileSync(MOMENTS_DATA, JSON.stringify(moments, null, 2), 'utf-8');
  res.json({ success: true, moment: newMoment });
});

// Admin: PUT /api/admin/moments/:id
router.put('/admin/moments/:id', isAdmin, (req, res) => {
  if (!fs.existsSync(MOMENTS_DATA)) return res.status(404).json({error:'数据不存在'});
  var moments = JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8'));
  var idx = moments.findIndex(function(m){return m.id == req.params.id;});
  if (idx === -1) return res.status(404).json({ error: '记录不存在' });
  if (req.body.title !== undefined) moments[idx].title = req.body.title;
  if (req.body.order !== undefined) moments[idx].order = parseInt(req.body.order);
  if (req.body.src !== undefined) moments[idx].src = req.body.src;
  fs.writeFileSync(MOMENTS_DATA, JSON.stringify(moments, null, 2), 'utf-8');
  res.json({ success: true });
});

// Admin: DELETE /api/admin/moments/:id
router.delete('/admin/moments/:id', isAdmin, (req, res) => {
  if (!fs.existsSync(MOMENTS_DATA)) return res.status(404).json({error:'数据不存在'});
  var moments = JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8'));
  var idx = moments.findIndex(function(m){return m.id == req.params.id;});
  if (idx === -1) return res.status(404).json({ error: '记录不存在' });
  moments.splice(idx, 1);
  fs.writeFileSync(MOMENTS_DATA, JSON.stringify(moments, null, 2), 'utf-8');
  res.json({ success: true });
});

// Admin: POST /api/admin/moments/reorder
router.post('/admin/moments/reorder', isAdmin, (req, res) => {
  var ids = req.body.ids;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({error:'无效数据'});
  if (!fs.existsSync(MOMENTS_DATA)) return res.json({success:true});
  var moments = JSON.parse(fs.readFileSync(MOMENTS_DATA, 'utf-8'));
  var lookup = {};
  moments.forEach(function(m){lookup[m.id]=m;});
  var reordered = [];
  ids.forEach(function(id, i){
    if (lookup[id]) {
      lookup[id].order = i + 1;
      reordered.push(lookup[id]);
    }
  });
  moments.forEach(function(m){
    if (reordered.indexOf(m) === -1) reordered.push(m);
  });
  fs.writeFileSync(MOMENTS_DATA, JSON.stringify(reordered, null, 2), 'utf-8');
  res.json({ success: true });
});
