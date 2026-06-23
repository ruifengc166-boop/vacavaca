const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
function load(n){const p=path.join(DATA_DIR,n+'.json');if(!fs.existsSync(p))return [];return JSON.parse(fs.readFileSync(p,'utf-8'));}
function save(n,d){fs.writeFileSync(path.join(DATA_DIR,n+'.json'),JSON.stringify(d,null,2),'utf-8');}

const users=load('users');
if(!users.find(u=>u.role==='admin')){
  const h=crypto.createHash('sha256').update('admin123').digest('hex');
  users.push({id:999,name:'管理员',email:'admin@vacat.cc',password:h,role:'admin',bio:'',specialty:'',status:'active',contact:'',created_at:new Date().toISOString()});save('users',users);
}
const creators=load('creators');
if(creators.length===0){
  save('creators',[
    {id:1,name:'星辰AI',avatar:'星',level:'super',specialty:'video',status:'active',bio:'专注AI视频创作与品牌视觉设计，第三届瓦卡奖金奖得主',tags:'AI视频,概念设计',works_count:3,likes:2300},
    {id:2,name:'AI梦幻师',avatar:'梦',level:'pro',specialty:'image',status:'active',bio:'原创AI绘画艺术家，擅长中国风AI绘画创作',tags:'AI图像,概念设计',works_count:4,likes:1800},
    {id:3,name:'视界讲述者',avatar:'视',level:'verified',specialty:'video',status:'active',bio:'AI人物故事片专业户，擅长情感史诗类AI短片',tags:'AI视频,短剧',works_count:2,likes:1200},
    {id:4,name:'数字幻场',avatar:'幻',level:'super',specialty:'concept',status:'active',bio:'数字艺术家，擅长AI装置与互动媒体装置',tags:'概念设计,其他',works_count:5,likes:3200},
    {id:5,name:'创意画郎',avatar:'画',level:'verified',specialty:'image',status:'active',bio:'AI视觉设计师，擅长商业AI插画与广告视觉',tags:'AI图像',works_count:3,likes:1500},
    {id:6,name:'光影AI',avatar:'光',level:'pro',specialty:'video',status:'inactive',bio:'AI宣传片专家，品牌视频设计师',tags:'AI视频,品牌宣传',works_count:2,likes:900},
    {id:7,name:'时代视觉',avatar:'时',level:'verified',specialty:'shortplay',status:'active',bio:'AI短剧创作者，擅长科幻主题短剧',tags:'短剧,AI视频',works_count:2,likes:1100},
    {id:8,name:'蓝艺AI',avatar:'蓝',level:'member',specialty:'image',status:'active',bio:'AI绘画创作者，喜好风景与宅家风格',tags:'AI图像',works_count:1,likes:400},
    {id:9,name:'智能视界',avatar:'智',level:'pro',specialty:'concept',status:'active',bio:'AI概念设计师，擅长未来主义与赛博朋克风格',tags:'概念设计',works_count:3,likes:2100},
  ]);
}
const works=load('works');
if(works.length===0){
  save('works',[
    {id:1,creator_id:1,title:'AI重构东方幻境',description:'用AI视频技术重新诠释敦煌壁画中的飞天形象',embed_type:'bilibili',embed_id:'BV1gvJG6qEBq',image_url:'http://i1.hdslb.com/bfs/archive/407e5952ffc113569d.jpg',created_at:'2026-05-10'},
    {id:2,creator_id:1,title:'星河之旅：AI生成短片',description:'完全由AI生成的奇幻星河短片，每一帧都是视觉盛宴',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-04-20'},
    {id:3,creator_id:1,title:'AI水墨风格实验动画',description:'探索AI技术在传统水墨动画中的应用边界',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-03-15'},
    {id:4,creator_id:2,title:'梦幻花园：AI超现实艺术',description:'AI生成的超现实花卉艺术系列，色彩与形态的极致探索',embed_type:'bilibili',embed_id:'BV1E5Jg6GEF4',image_url:'http://i1.hdslb.com/bfs/archive/62e3f3603e458aed62.jpg',created_at:'2026-05-01'},
    {id:5,creator_id:2,title:'山水重构：AI重新诠释国画',description:'用AI重新诠释中国传统山水画，从古画中学习再创造',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-04-10'},
    {id:6,creator_id:2,title:'星空之鹿：神话生物AI视觉',description:'神话生物与星空的AI视觉融合',embed_type:'bilibili',embed_id:'BV1aHjG6eE8b',image_url:'http://i0.hdslb.com/bfs/archive/8dbd00fb3d8cbcd077.jpg',created_at:'2026-03-20'},
    {id:7,creator_id:4,title:'新媒体矩阵：AI互动装置',description:'AI互动装置艺术，探索数字与现实的边界',embed_type:'bilibili',embed_id:'BV1yXju61Ea9',image_url:'http://i1.hdslb.com/bfs/archive/7a673972c588cbdc0a.jpg',created_at:'2026-05-15'},
    {id:8,creator_id:4,title:'光影隧道：沉浸式AI体验',description:'沉浸式AI视觉体验空间设计',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-04-25'},
    {id:9,creator_id:5,title:'商业美学：AI品牌广告',description:'为某科技品牌打造的AI视觉广告系列',embed_type:'bilibili',embed_id:'BV1pUJG6oEVS',image_url:'http://i1.hdslb.com/bfs/archive/378a1b54cfa0920e77.jpg',created_at:'2026-05-05'},
    {id:10,creator_id:3,title:'AI情感叙事短片：再见',description:'AI人物故事片，讲述一个关于告别的温暖故事',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-05-18'},
    {id:11,creator_id:7,title:'科幻短剧：最后的信号',description:'AI生成科幻短剧，末日背景下的人类最后信号',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-05-22'},
    {id:12,creator_id:9,title:'赛博朋克都市概念设计',description:'AI概念设计师眼中的未来都市',embed_type:'upload',embed_id:'',image_url:'',created_at:'2026-05-25'},
  ]);
}
if(!fs.existsSync(path.join(DATA_DIR,'referrals.json')))save('referrals',[]);
module.exports={load,save};

