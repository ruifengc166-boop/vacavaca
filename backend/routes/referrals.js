const db = require('../db');
const router = require('express').Router();

router.get('/', (req, res, next) => {
  try {
    res.json(db.load('referrals'));
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const { name, email, creator_name, reason } = req.body;
    if (!name || !email) return res.status(400).json({ error: '姓名和邮箱不能为空' });
    const referrals = db.load('referrals');
    const id = referrals.length > 0 ? Math.max(...referrals.map(r => r.id)) + 1 : 1;
    referrals.push({ id, name, email, creator_name: creator_name || '', reason: reason || '', created_at: new Date().toISOString() });
    db.save('referrals', referrals);
    res.json({ success: true, id });
  } catch (err) { next(err); }
});

module.exports = router;
