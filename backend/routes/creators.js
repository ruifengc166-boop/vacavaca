const db = require('../db');
const router = require('express').Router();

router.get('/', (req, res, next) => {
  try {
    let creators = db.load('creators');
    const { level, specialty, status } = req.query;
    if (level && level !== 'all') creators = creators.filter(c => c.level === level);
    if (status && status !== 'all') creators = creators.filter(c => c.status === status);
    if (specialty && specialty !== 'all') creators = creators.filter(c => (c.specialty||'').includes(specialty));
    creators.sort((a,b) => {
      const order = { super: 0, pro: 1, verified: 2, member: 3 };
      return (order[a.level]||3) - (order[b.level]||3) || (b.likes||0) - (a.likes||0);
    });
    res.json(creators);
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const creators = db.load('creators');
    const c = creators.find(c => c.id == req.params.id);
    if (!c) return res.status(404).json({ error: '创作者不存在' });
    res.json(c);
  } catch (err) { next(err); }
});

module.exports = router;
