const db = require('../db');
const router = require('express').Router();

// GET /api/content - public endpoint for frontend
router.get('/', function(req, res) {
    const content = db.load('content');
    res.json(content);
});

// Admin auth check
function isAdmin(req, res, next) {
    const users = db.load('users');
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({error:'未登录'});
    try {
        var parts = h.split(' ')[1].split('.'); if (parts.length !== 3) return res.status(401).json({error:'无效凭证'}); const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (p.exp < Date.now()) return res.status(401).json({error:'登录已过期'});
        if (!users.find(u => u.id === p.id && u.role === 'admin')) return res.status(403).json({error:'需要管理员权限'});
        next();
    } catch(e) { res.status(401).json({error:'无效凭证'}); }
}

// GET /api/admin/content - admin get all
router.get('/admin/content', isAdmin, function(req, res) {
    res.json(db.load('content'));
});

// PUT /api/admin/content - admin update
router.put('/admin/content', isAdmin, function(req, res) {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') return res.status(400).json({error:'无效数据'});
    let content = db.load('content');
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    deepMerge(content, updates);
    db.save('content', content);
    res.json({success:true});
});

module.exports = router;
