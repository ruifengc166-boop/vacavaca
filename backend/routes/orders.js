const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { verifyToken } = require('./users');
const router = require('express').Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) { cb(null, UPLOADS_DIR); },
    filename: function(req, file, cb) {
      cb(null, 'brief-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.zip', '.mp4', '.mov'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

const VALID_STATUS = ['new', 'qualified', 'quoted', 'confirmed', 'in_production', 'review', 'delivered', 'closed', 'lost'];

function isAdmin(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  const id = verifyToken(h.split(' ')[1]);
  if (!id) return res.status(401).json({ error: '登录已过期' });
  const user = db.load('users').find(u => u.id === id && u.role === 'admin');
  if (!user) return res.status(403).json({ error: '需要管理员权限' });
  req.userId = id;
  next();
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value || '').split(',').map(v => v.trim()).filter(Boolean);
}

function cleanOrderInput(body) {
  return {
    selected_template_id: Number(body.selected_template_id || body.template_id || 0),
    company: String(body.company || '').trim(),
    contact_name: String(body.contact_name || body.name || '').trim(),
    email: String(body.email || '').trim(),
    whatsapp: String(body.whatsapp || '').trim(),
    wechat: String(body.wechat || '').trim(),
    brand_website: String(body.brand_website || '').trim(),
    product_name: String(body.product_name || '').trim(),
    product_url: String(body.product_url || '').trim(),
    target_market: String(body.target_market || '').trim(),
    target_platform: asArray(body.target_platform),
    budget: String(body.budget || '').trim(),
    timeline: String(body.timeline || '').trim(),
    product_description: String(body.product_description || body.description || '').trim(),
    creative_direction: String(body.creative_direction || '').trim(),
    reference_links: String(body.reference_links || '').trim(),
    additional_notes: String(body.additional_notes || '').trim(),
    asset_urls: Array.isArray(body.asset_urls) ? body.asset_urls : asArray(body.asset_urls),
  };
}

function orderWithTemplate(order) {
  const template = db.load('templates').find(t => t.id == order.selected_template_id);
  return { ...order, template_title: template ? template.title : '' };
}

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  res.json({ success: true, url: '/uploads/' + req.file.filename });
});

router.post('/', (req, res, next) => {
  try {
    const input = cleanOrderInput(req.body || {});
    if (!input.company || !input.contact_name || !input.email) {
      return res.status(400).json({ error: 'Company, contact name and email are required.' });
    }
    if (!input.product_name && !input.product_url) {
      return res.status(400).json({ error: 'Please provide a product name or product URL.' });
    }
    const orders = db.load('orders');
    const id = orders.length > 0 ? Math.max(...orders.map(o => Number(o.id || 0))) + 1 : 1;
    const now = new Date().toISOString();
    const order = {
      id,
      status: 'new',
      source: 'website',
      ...input,
      internal_notes: [],
      assigned_to: '',
      delivery_urls: [],
      created_at: now,
      updated_at: now,
    };
    orders.push(order);
    db.save('orders', orders);
    res.json({ success: true, id });
  } catch (err) { next(err); }
});

router.get('/admin/orders', isAdmin, (req, res, next) => {
  try {
    const orders = db.load('orders').slice().sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    res.json(orders.map(orderWithTemplate));
  } catch (err) { next(err); }
});

router.get('/admin/orders/:id', isAdmin, (req, res, next) => {
  try {
    const order = db.load('orders').find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json(orderWithTemplate(order));
  } catch (err) { next(err); }
});

router.put('/admin/orders/:id', isAdmin, (req, res, next) => {
  try {
    const orders = db.load('orders');
    const idx = orders.findIndex(o => o.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: '订单不存在' });
    const body = req.body || {};
    if (body.status !== undefined && VALID_STATUS.includes(body.status)) orders[idx].status = body.status;
    if (body.assigned_to !== undefined) orders[idx].assigned_to = String(body.assigned_to || '').trim();
    if (body.delivery_urls !== undefined) orders[idx].delivery_urls = asArray(body.delivery_urls);
    if (body.budget !== undefined) orders[idx].budget = String(body.budget || '').trim();
    if (body.timeline !== undefined) orders[idx].timeline = String(body.timeline || '').trim();
    if (body.additional_notes !== undefined) orders[idx].additional_notes = String(body.additional_notes || '').trim();
    if (body.internal_note) {
      if (!Array.isArray(orders[idx].internal_notes)) orders[idx].internal_notes = [];
      orders[idx].internal_notes.push({ text: String(body.internal_note).trim(), author: 'admin', created_at: new Date().toISOString() });
    }
    orders[idx].updated_at = new Date().toISOString();
    db.save('orders', orders);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/admin/orders/:id', isAdmin, (req, res, next) => {
  try {
    let orders = db.load('orders');
    orders = orders.filter(o => o.id != req.params.id);
    db.save('orders', orders);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
