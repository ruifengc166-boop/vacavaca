const db = require('../db');
const { verifyToken } = require('./users');
const router = require('express').Router();

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

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value || '').split(',').map(v => v.trim()).filter(Boolean);
}

function sortTemplates(items) {
  return items.slice().sort((a, b) => {
    const ao = Number(a.sort_order || 9999);
    const bo = Number(b.sort_order || 9999);
    if (ao !== bo) return ao - bo;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function sanitizeTemplate(input, existing) {
  const now = new Date().toISOString();
  return {
    ...(existing || {}),
    title: input.title !== undefined ? String(input.title || '').trim() : (existing ? existing.title : ''),
    description: input.description !== undefined ? String(input.description || '').trim() : (existing ? existing.description : ''),
    cover_image: input.cover_image !== undefined ? String(input.cover_image || '').trim() : (existing ? existing.cover_image : ''),
    preview_video_url: input.preview_video_url !== undefined ? String(input.preview_video_url || '').trim() : (existing ? existing.preview_video_url : ''),
    industry: input.industry !== undefined ? String(input.industry || '').trim() : (existing ? existing.industry : ''),
    style_tags: input.style_tags !== undefined ? normalizeTags(input.style_tags) : (existing ? existing.style_tags || [] : []),
    duration: input.duration !== undefined ? String(input.duration || '').trim() : (existing ? existing.duration : ''),
    aspect_ratio: input.aspect_ratio !== undefined ? String(input.aspect_ratio || '').trim() : (existing ? existing.aspect_ratio : ''),
    base_price: input.base_price !== undefined ? String(input.base_price || '').trim() : (existing ? existing.base_price : ''),
    turnaround: input.turnaround !== undefined ? String(input.turnaround || '').trim() : (existing ? existing.turnaround : ''),
    difficulty: input.difficulty !== undefined ? String(input.difficulty || '').trim() : (existing ? existing.difficulty : ''),
    related_work_id: input.related_work_id !== undefined ? Number(input.related_work_id || 0) : (existing ? existing.related_work_id || 0 : 0),
    status: input.status !== undefined ? String(input.status || 'draft') : (existing ? existing.status : 'draft'),
    sort_order: input.sort_order !== undefined ? Number(input.sort_order || 999) : (existing ? existing.sort_order || 999 : 999),
    updated_at: now,
  };
}

router.get('/', (req, res, next) => {
  try {
    const templates = db.load('templates').filter(t => t.status === 'published');
    res.json(sortTemplates(templates));
  } catch (err) { next(err); }
});

router.get('/admin/templates', isAdmin, (req, res, next) => {
  try { res.json(sortTemplates(db.load('templates'))); }
  catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const template = db.load('templates').find(t => t.id == req.params.id && t.status === 'published');
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) { next(err); }
});

router.post('/admin/templates', isAdmin, (req, res, next) => {
  try {
    const templates = db.load('templates');
    const id = templates.length > 0 ? Math.max(...templates.map(t => Number(t.id || 0))) + 1 : 1;
    const template = sanitizeTemplate(req.body, null);
    if (!template.title) return res.status(400).json({ error: '模板名称不能为空' });
    template.id = id;
    template.created_at = new Date().toISOString();
    templates.push(template);
    db.save('templates', templates);
    res.json({ success: true, id });
  } catch (err) { next(err); }
});

router.put('/admin/templates/:id', isAdmin, (req, res, next) => {
  try {
    const templates = db.load('templates');
    const idx = templates.findIndex(t => t.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: '模板不存在' });
    const updated = sanitizeTemplate(req.body, templates[idx]);
    if (!updated.title) return res.status(400).json({ error: '模板名称不能为空' });
    templates[idx] = updated;
    db.save('templates', templates);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/admin/templates/:id', isAdmin, (req, res, next) => {
  try {
    let templates = db.load('templates');
    templates = templates.filter(t => t.id != req.params.id);
    db.save('templates', templates);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
