const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('https');
const querystring = require('querystring');
const db = require('../db');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2,8) + path.extname(file.originalname));
  }
});
const upload = multer({
  storage, limits: { fileSize: 10*1024*1024 },
  fileFilter: function(req,file,cb){
    const exts=['.jpg','.jpeg','.png','.gif','.webp','.jfif'];
    cb(null, exts.includes(path.extname(file.originalname).toLowerCase()));
  }
});

function isAdmin(req,res,next){
  const users=db.load('users');
  const h=req.headers.authorization;
  if(!h||!h.startsWith('Bearer '))return res.status(401).json({error:'未登录'});
  try{
    var parts=h.split(' ')[1].split('.');if(parts.length!==3)return res.status(401).json({error:'无效凭证'});const p=JSON.parse(Buffer.from(parts[1],'base64url').toString());
    if(p.exp<Date.now())return res.status(401).json({error:'登录已过期'});
    if(!users.find(u=>u.id===p.id&&u.role==='admin'))return res.status(403).json({error:'需要管理员权限'});
    next();
  }catch(e){res.status(401).json({error:'无效凭证'});}
}

// Bilibili API proxy - get video info by BV ID
router.get('/bilibili-info', function(req,res,next){
  const bv=req.query.bvid||req.query.bv||'';
  if(!bv)return res.status(400).json({error:'缺少BV ID'});
  const encodedBv=encodeURIComponent(bv);
  const options={
    hostname:'api.bilibili.com',
    path:'/x/web-interface/view?bvid='+encodedBv,
    method:'GET',
    headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com','Accept-Encoding':'identity'}
  };
  const bufs=[];
  const r=http.request(options,function(resp){
    resp.on('data',chunk=>bufs.push(typeof chunk==='string'?Buffer.from(chunk):chunk));
    resp.on('end',function(){
      const data=Buffer.concat(bufs).toString('utf-8');
      try{
        const json=JSON.parse(data);
        if(json.code===0){
          res.json({success:true,title:json.data.title,cover:json.data.pic,desc:json.data.desc,bvid:bv,owner_name:json.data.owner?json.data.owner.name:"",owner_face:json.data.owner?json.data.owner.face:""});
        }else{
          res.json({success:false,error:'B站API返回错误: code='+json.code});
        }
      }catch(e){res.json({success:false,error:'解析B站数据失败'});}
    });
  });
  r.on('error',function(){res.json({success:false,error:'无法连接B站API'});});
  r.end();
});

// GET /api/works
router.get('/',function(req,res,next){
  let works=db.load('works');
  console.log('WORKS_ROUTE: loaded', works.length, 'works');
  if(req.query.creator_id)works=works.filter(w=>w.creator_id==req.query.creator_id);if(req.query.award)works=works.filter(w=>w.award===req.query.award);if(req.query.track)works=works.filter(w=>w.track===req.query.track);if(req.query.edition)works=works.filter(w=>w.edition===req.query.edition);
  works.sort((a,b)=>b.id-a.id);
  const creators=db.load('creators');
  res.json(works.map(w=>{const c=creators.find(cr=>cr.id===w.creator_id);return{...w,creator_name:c?c.name:'未知'};}));
});

// Admin GET
router.get('/admin/works',isAdmin,function(req,res,next){
  const works=db.load('works');
  const creators=db.load('creators');
  res.json(works.map(w=>{const c=creators.find(cr=>cr.id===w.creator_id);return{...w,creator_name:c?c.name:'未知'};}).reverse());
});

// Admin POST
router.post('/admin/works',isAdmin,upload.single('file'),function(req,res,next){
  const{title,description,creator_id,embed_type,embed_id,image_url,award,track,edition}=req.body;
  if(!title||!creator_id)return res.status(400).json({error:'标题和创作者不能为空'});
  const works=db.load('works');
  const id=works.length>0?Math.max(...works.map(w=>w.id))+1:1;
  works.push({id,creator_id:parseInt(creator_id),title,description:description||'',embed_type:embed_type||'upload',embed_id:embed_id||'',image_url:req.file?'/uploads/'+req.file.filename:(image_url||''),award:award||'',track:track||'',edition:edition||'',created_at:new Date().toISOString().split('T')[0]});
  db.save('works',works);
  const creators=db.load('creators');
  const ci=creators.findIndex(c=>c.id==creator_id);
  if(ci!==-1){creators[ci].works_count=(creators[ci].works_count||0)+1;db.save('creators',creators);}
  res.json({success:true,id});
});

// Admin PUT
router.put('/admin/works/:id',isAdmin,upload.single('file'),function(req,res,next){
  let works=db.load('works');
  console.log('WORKS_ROUTE: loaded', works.length, 'works');
  const idx=works.findIndex(w=>w.id==req.params.id);
  if(idx===-1)return res.status(404).json({error:'作品不存在'});
  const{title,description,creator_id,embed_type,embed_id,image_url,award,track}=req.body;
  if(title!==undefined)works[idx].title=title;
  if(description!==undefined)works[idx].description=description;
  if(creator_id!==undefined)works[idx].creator_id=parseInt(creator_id);
  if(embed_type!==undefined)works[idx].embed_type=embed_type;
  if(embed_id!==undefined)works[idx].embed_id=embed_id;
  if(award!==undefined)works[idx].award=award;if(track!==undefined)works[idx].track=track;if(edition!==undefined)works[idx].edition=edition;if(req.file)works[idx].image_url='/uploads/'+req.file.filename;
  else if(image_url!==undefined)works[idx].image_url=image_url;
  db.save('works',works);
  res.json({success:true});
});

// Admin DELETE
router.delete('/admin/works/:id',isAdmin,function(req,res,next){
  let works=db.load('works');
  console.log('WORKS_ROUTE: loaded', works.length, 'works');
  const w=works.find(w=>w.id==req.params.id);
  works=works.filter(w=>w.id!=req.params.id);
  db.save('works',works);
  if(w){const cs=db.load('creators');const ci=cs.findIndex(c=>c.id==w.creator_id);if(ci!==-1){cs[ci].works_count=Math.max(0,(cs[ci].works_count||0)-1);db.save('creators',cs);}}
  res.json({success:true});
});

module.exports=router;


