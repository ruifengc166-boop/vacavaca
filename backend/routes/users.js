const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'vacat_jwt_secret_2026';
const db = require('../db');
const router = require('express').Router();

function hash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(pw, salt, 10000, 32, 'sha256').toString('hex');
  return salt + ':' + h;
}
function makeToken(id) {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({id,exp:Date.now()+7*24*60*60*1000})).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header+'.'+payload).digest('base64url');
  return header+'.'+payload+'.'+sig;
}
function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(parts[0]+'.'+parts[1]).digest('base64url');
    if (sig !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload.id;
  } catch(e) { return null; }
}

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '请填写所有必填字段' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位字符' });
  
  const users = db.load('users');
  if (users.find(u => u.email === email)) return res.status(400).json({ error: '该邮箱已注册' });
  
  const id = users.length + 1;
  users.push({ id, name, email, password: hash(password), role:'member', bio:'', specialty:'', status:'active', contact:'', created_at: new Date().toISOString() });
  db.save('users', users);

  const creators = db.load('creators');
  creators.push({ id: creators.length+1, user_id: id, name, avatar: name[0], level:'member', specialty:'', status:'active', bio:'', tags:'', contact:'', works_count:0, likes:0, created_at: new Date().toISOString() });
  db.save('creators', creators);

  const token = makeToken(id);
  res.json({ token, user: { id, name, email, role:'member' } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '请填写邮箱和密码' });
  const users = db.load('users');
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: '邮箱或密码错误' });
  // Backward-compatible password check
  var pwOk = false;
  if (user.password.indexOf(':') > 0) {
    var parts = user.password.split(':'), salt = parts[0], storedHash = parts[1];
    pwOk = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex') === storedHash;
  } else {
    pwOk = crypto.createHash('sha256').update(password).digest('hex') === user.password;
    if (pwOk) {
      // Upgrade to new hash format
      var idx = users.findIndex(u => u.email === email);
      if (idx >= 0) { users[idx].password = hash(password); db.save('users', users); }
    }
  }
  if (!pwOk) return res.status(400).json({ error: '邮箱或密码错误' });
  const token = makeToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  const id = verifyToken(header.split(' ')[1]);
  if (!id) return res.status(401).json({ error: '登录已过期' });
  req.userId = id;
  next();
}

router.get('/profile', auth, (req, res) => {
  const users = db.load('users');
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const { password, ...safe } = user;
  res.json(safe);
});

router.put('/profile', auth, (req, res) => {
  const { name, bio, specialty, status, contact } = req.body;
  let users = db.load('users');
  const idx = users.findIndex(u => u.id === req.userId);
  if (idx === -1) return res.status(404).json({ error: '用户不存在' });
  Object.assign(users[idx], { name: name||'', bio: bio||'', specialty: specialty||'', status: status||'active', contact: contact||'' });
  db.save('users', users);

  let creators = db.load('creators');
  const cIdx = creators.findIndex(c => c.user_id === req.userId);
  if (cIdx !== -1) {
    Object.assign(creators[cIdx], { name: name||'', bio: bio||'', specialty: specialty||'', status: status||'active', contact: contact||'' });
    db.save('creators', creators);
  }
  res.json({ success: true });
});

module.exports = { router, auth, verifyToken };
