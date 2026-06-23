(function(){
var API = window.location.origin;
var DEFAULT_THUMB = '/assets/images/default-cover.png';

// ===== NAVBAR SCROLL =====
var nav = document.querySelector('.navbar');
if(nav) window.addEventListener('scroll', function(){
    nav.style.borderBottomColor = window.scrollY > 50 ? 'rgba(202,254,97,0.15)' : 'rgba(255,255,255,0.06)';
});

// ===== MOBILE TOGGLE =====
var tg = document.querySelector('.nav-toggle');
var lk = document.querySelector('.nav-links');
if(tg && lk) tg.addEventListener('click', function(){lk.classList.toggle('mobile-open');});

// ===== ACTIVE NAV =====
var cp = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(function(a){
    if(a.getAttribute('href') === cp) a.classList.add('nav-active');
});

// ===== FAQ TOGGLE =====
document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click', function(){q.parentElement.classList.toggle('open');});
});

// ===== FADE-IN OBSERVER =====
var obs = new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting) e.target.classList.add('visible');});
}, {threshold: 0.1});
document.querySelectorAll('.fade-in').forEach(function(el){obs.observe(el);});

// ===== BILIBILI URL =====
function biliUrl(bv, auto){
    if(!bv) return '';
    var m = bv.match(/BV[0-9A-Za-z]{10,}/);
    if(m) bv = m[0];
    return 'https://player.bilibili.com/player.html?bvid=' + bv + (auto ? '&autoplay=1' : '') + '&high_quality=1';
}

// ===== VIDEO MODAL =====
var modal = document.createElement('div');
modal.className = 'video-modal';
modal.innerHTML = '<div class="modal-close" onclick="closeVideoModal()">\u00d7</div><div class="modal-content"><div class="embed-wrap" id="modalEmbed"></div><div class="modal-info"><h2 id="modalTitle"></h2><p id="modalDesc"></p></div></div>';
modal.addEventListener('click', function(e){if(e.target === modal) closeVideoModal();});
document.body.appendChild(modal);

window.closeVideoModal = function(){
    modal.classList.remove('open');
    document.getElementById('modalEmbed').innerHTML = '';
};
window.openVideoModal = function(bv, title, desc, creator, creatorId){
    if(!bv) return;
    var url = biliUrl(bv, true);
    if(!url) return;
    document.getElementById('modalEmbed').innerHTML = '<iframe src="'+url+'" allowfullscreen></iframe>';
    document.getElementById('modalTitle').textContent = title || '';
    var descHtml = desc || '';
    if(creator){
        if(creatorId){
            descHtml += ' - <a href="creator-profile.html?id='+creatorId+'" target="_blank" style="color:var(--gold);text-decoration:underline">'+creator+'</a>';
        } else {
            descHtml += ' - '+creator;
        }
    }
    document.getElementById('modalDesc').innerHTML = descHtml;
    modal.classList.add('open');
};

// ===== ESC & HASBV =====
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hasBV(id){return id && (id.indexOf('BV')===0 || id.indexOf('AV')===0 || id.indexOf('upload')===0 || id.indexOf('bilibili')===0);}

// ===== CREATORS DATA =====
var levelNames = {explorer:"Explorer", dreamer:"Dreamer", creator:"Creator"};
var colors = ["#cafe61","#dafe81","#a8d43e","#1A1A1A","#2A2A2A","#0A0A0A"];
var creators = [];
function mapApiCreator(c){
    return {
        id: c.id,
        name: c.name,
        av: c.avatar && c.avatar.length > 2 && (c.avatar.indexOf('http')===0 || c.avatar.indexOf('/')===0) ? c.avatar : (c.avatar || c.name[0]),
        avatar: c.avatar || c.name[0],
        lv: c.level || 'dreamer',
        sp: c.specialty || '',
        st: c.status || 'active',
        bio: c.bio || '',
        tags: typeof c.tags === 'string' ? c.tags.split(',').map(function(t){return t.trim();}).filter(Boolean) : (c.tags || []),
        works_count: c.works_count || 0,
        likes: c.likes || 0
    };
}

fetch(API+'/api/creators').then(function(r){return r.json()}).then(function(data){
    creators = data.map(mapApiCreator);
    renderCreators(creators, 12);
    var sel = document.getElementById('ref_creator');
    if(sel){ sel.innerHTML = '<option value="">\u4e0d\u6307\u5b9a</option>'; creators.forEach(function(c){sel.innerHTML += '<option value="'+c.name+'">'+c.name+'</option>';}); }
}).catch(function(e){console.error("Async error:",e);});

window.filterCreators = function(page){
    var query = (document.getElementById('filterCreatorSearch')?.value || '').toLowerCase().trim();
    var levelFilter = document.getElementById('filterCreatorLevel')?.value || '';
    var statusFilter = document.getElementById('filterCreatorStatus')?.value || '';
    var filtered = window.allCreators.filter(function(c){
        if(query && c.name.toLowerCase().indexOf(query) < 0) return false;
        if(levelFilter && c.lv !== levelFilter) return false;
        if(statusFilter && c.st !== statusFilter) return false;
        return true;
    });
    if(page !== undefined) window.creatorPage = page;
    if(!window.creatorPage) window.creatorPage = 1;
    var total = filtered.length;
    var totalPages = Math.ceil(total / 12) || 1;
    if(window.creatorPage > totalPages) window.creatorPage = totalPages;
    var start = (window.creatorPage - 1) * 12;
    var paged = filtered.slice(start, start + 12);
    var cg = document.getElementById('creators-grid');
    if(cg){
        if(total === 0){
            cg.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text3);font-size:16px">\u6682\u65f6\u4e3a\u7a7a</div>';
        } else {
            cg.innerHTML = '';
            paged.forEach(function(c, i){
                var statusBadge = c.st === 'active' ? '<span style="font-size:11px;color:#34D399;margin-left:8px">\u25cf \u63a5\u5355\u4e2d</span>' : '<span style="font-size:11px;color:var(--text3);margin-left:8px">\u25cb \u6682\u505c</span>';
                var avatarColor = colors[i%6];
                var avContent = c.av && (c.av.indexOf('http')===0 || c.av.indexOf('/')===0)
                    ? '<img src="'+c.av+'" style="width:56px;height:56px;border-radius:50%;object-fit:cover">'
                    : '<div style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+avatarColor+';font-size:22px;font-weight:700;color:#fff">'+(c.av||'?')+'</div>';
                cg.innerHTML += '<div class="video-card" onclick="window.open(\'creator-profile.html?id='+c.id+'\',\'_self\')" style="display:flex;align-items:center;padding:16px;gap:14px">'+avContent+'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><h4 style="font-size:15px;font-weight:600;margin:0">'+c.name+'</h4>'+statusBadge+'</div><div style="font-size:12px;color:var(--text3);margin:6px 0"><span class="badge-sm badge-'+c.lv+'">'+levelNames[c.lv]+'</span><span style="margin-left:8px">\ud83d\udcc4 '+c.works_count+'\u4f5c\u54c1</span><span style="margin-left:6px">\ud83d\udc4d '+c.likes+'</span></div><div style="font-size:11px;color:var(--text3);line-height:1.4">'+c.tags.join('/')+'</div><div style="margin-top:4px;font-size:12px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c.bio+'</div></div></div>';
            });
        }
    }
    var pg = document.getElementById('creatorsPagination');
    if(pg){
        if(totalPages <= 1){ pg.innerHTML = ''; return; }
        var h = '';
        for(var i = 1; i <= totalPages; i++){
            h += '<button onclick="window.filterCreators('+i+')" style="background:'+(i===window.creatorPage?'var(--gold)':'var(--bg2)')+';color:'+(i===window.creatorPage?'#000':'var(--text)')+';border:1px solid var(--border);border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;font-weight:'+(i===window.creatorPage?'700':'400')+'">'+i+'</button>';
        }
        pg.innerHTML = h;
    }
};

// ===== WORKS =====
fetch(API+'/api/works').then(function(r){return r.json()}).then(function(works){
    // Hero section
    var hg = document.getElementById('hero-works');
    if(hg && works.length > 0){
        var awardOrder = {'\u91d1\u5956':0,'\u94f6\u5956':1,'\u94dc\u5956':2,'\u4f18\u79c0\u5956':3};
        var editionOrder = {'\u7b2c\u4e8c\u5c4a':0,'\u7b2c\u4e00\u5c4a':1};
        var sortedHero = works.slice().sort(function(a,b){
            var ae = editionOrder[a.edition] !== undefined ? editionOrder[a.edition] : 2;
            var be = editionOrder[b.edition] !== undefined ? editionOrder[b.edition] : 2;
            if(ae !== be) return ae - be;
            var aa = awardOrder[a.award] !== undefined ? awardOrder[a.award] : 4;
            var ba = awardOrder[b.award] !== undefined ? awardOrder[b.award] : 4;
            return aa - ba;
        });
        var heroWorks = sortedHero.slice(0, 3);
        var centerIdx = 1;
        function handleHeroClick(idx){
            if(idx === centerIdx){
                var w = heroWorks[idx];
                if(hasBV(w.embed_id)) openVideoModal(w.embed_id, w.title, w.description, w.creator_name, w.creator_id);
            } else {
                centerIdx = idx;
                renderHeroWorks();
            }
        }
        function renderHeroWorks(){
            if(!hg.querySelector("[data-hero-idx]")){
                var h="";
                heroWorks.forEach(function(w,i){
                    var isCenter=i===centerIdx,cls=isCenter?"hero-feat":"hero-item";
                    var img=w.image_url?"<img src=\""+w.image_url+"\" alt=\""+esc(w.title)+"\">":"<img src=\""+DEFAULT_THUMB+"\" alt=\""+esc(w.title)+"\" style=\"width:100%;height:100%;object-fit:cover\">";
                    h+="<div class=\""+cls+"\" data-hero-idx=\""+i+"\" onclick=\"handleHeroClick("+i+")\"><div style=\"width:100%;height:100%\">"+img+"<div class=\"play-overlay\"><div class=\"play-btn\">&#9654;</div></div></div><div class=\"info\"><h3>"+esc(w.title)+"</h3><span>"+esc(w.creator_name)+"</span></div></div>";
                });
                hg.innerHTML=h;
            } else {
                hg.querySelectorAll("[data-hero-idx]").forEach(function(el,i){
                    el.className=i===centerIdx?"hero-feat":"hero-item";
                });
            }
        }
        renderHeroWorks();
        window.handleHeroClick = handleHeroClick;
    }
    window.allWorks = works;

    // Render works grid
    function renderWorksGrid(gridId, items){
        var grid = document.getElementById(gridId);
        if(!grid) return;
        grid.innerHTML = '';
        items.forEach(function(w){
            var tag = "";
            var awardColors = {"\u91d1\u5956":{bg:"rgba(255,215,0,0.18)",color:"#FFD700"},"\u94f6\u5956":{bg:"rgba(192,192,192,0.18)",color:"#C0C0C0"},"\u94dc\u5956":{bg:"rgba(205,127,50,0.18)",color:"#CD7F32"},"\u4f18\u79c0\u5956":{bg:"rgba(155,89,182,0.18)",color:"#9B59B6"}};
            var ac = awardColors[w.award] || {bg:'rgba(202,254,97,0.15)',color:'var(--gold)'};
            var awardTag = w.award ? '<span class="bilibili-tag" style="background:'+ac.bg+';color:'+ac.color+';margin-left:4px">'+w.award+'</span>' : '';
            var hasV = hasBV(w.embed_id);
            var thumb = w.image_url ? '<img src="'+w.image_url+'" alt="'+esc(w.title)+'">' : '<img src="'+DEFAULT_THUMB+'" alt="'+esc(w.title)+'" style="width:100%;height:100%;object-fit:cover">';
            var click = hasV ? 'openVideoModal(\''+esc(w.embed_id)+'\',\''+esc(w.title)+'\',\''+esc(w.description)+'\',\''+esc(w.creator_name)+'\',\''+w.creator_id+'\')' : '';
            grid.innerHTML += '<div class="video-card"'+(click ? ' onclick="'+click+'"' : '')+'><div class="thumb">'+thumb+'<div class="play-badge">&#9654;</div></div><div class="body"><h4>'+esc(w.title)+tag+awardTag+'</h4><div class="meta"><span class="creator">'+esc(w.creator_name)+'</span></div></div></div>';
        });
    }

    // Pagination + Filter
    window.currentPage = 1;
    window.pageSize = 20;
    window.filterWorks = function(page){
        var edition = document.getElementById('filterEdition')?.value || '';
        var award = document.getElementById('filterAward')?.value || '';
        var track = document.getElementById('filterTrack')?.value || '';
        var query = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
        var filtered = window.allWorks.filter(function(w){
            if(edition && w.edition !== edition) return false;
            if(award && w.award !== award) return false;
            if(track && w.track !== track) return false;
            if(query){
                var titleMatch = (w.title || '').toLowerCase().indexOf(query) >= 0;
                var creatorMatch = (w.creator_name || '').toLowerCase().indexOf(query) >= 0;
                if(!titleMatch && !creatorMatch) return false;
            }
            return true;
        });
        var awardOrder = {'\u91d1\u5956':0,'\u94f6\u5956':1,'\u94dc\u5956':2,'\u4f18\u79c0\u5956':3};
        var editionOrder = {'\u7b2c\u4e8c\u5c4a':0,'\u7b2c\u4e00\u5c4a':1};
        filtered.sort(function(a,b){
            var ae = editionOrder[a.edition] !== undefined ? editionOrder[a.edition] : 2;
            var be = editionOrder[b.edition] !== undefined ? editionOrder[b.edition] : 2;
            if(ae !== be) return ae - be;
            var aa = awardOrder[a.award] !== undefined ? awardOrder[a.award] : 4;
            var ba = awardOrder[b.award] !== undefined ? awardOrder[b.award] : 4;
            return aa - ba;
        });
        if(page !== undefined) window.currentPage = page;
        var total = filtered.length;
        var totalPages = Math.ceil(total / window.pageSize) || 1;
        if(window.currentPage > totalPages) window.currentPage = totalPages;
        var start = (window.currentPage - 1) * window.pageSize;
        var paged = filtered.slice(start, start + window.pageSize);
        renderWorksGrid('works-grid', paged);
        var pg = document.getElementById('worksPagination');
        if(pg){
            if(totalPages <= 1){ pg.innerHTML = ''; return; }
            var h = '';
            for(var i = 1; i <= totalPages; i++){
                h += '<button onclick="window.filterWorks('+i+')" style="background:'+(i===window.currentPage?'var(--gold)':'var(--bg2)')+';color:'+(i===window.currentPage?'#000':'var(--text)')+';border:1px solid var(--border);border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;font-weight:'+(i===window.currentPage?'700':'400')+'">'+i+'</button>';
            }
            pg.innerHTML = h;
        }
        if(total === 0 && document.getElementById('works-grid')){
            document.getElementById('works-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text3);font-size:16px">\u6682\u65f6\u4e3a\u7a7a</div>';
        }
    };

    // Init grids
    var grids = [document.getElementById('works-grid'), document.getElementById('home-works-grid'), document.getElementById('vacat-works')];
    grids.forEach(function(grid){
        if(!grid) return;
        if(grid.id === 'works-grid'){
            window.filterWorks(1);
        } else if(grid.id === 'home-works-grid'){
            var awardOrder = {'\u91d1\u5956':0,'\u94f6\u5956':1,'\u94dc\u5956':2,'\u4f18\u79c0\u5956':3};
            var editionOrder = {'\u7b2c\u4e8c\u5c4a':0,'\u7b2c\u4e00\u5c4a':1};
            var sorted = works.slice().sort(function(a,b){
                var ae = editionOrder[a.edition] !== undefined ? editionOrder[a.edition] : 2;
                var be = editionOrder[b.edition] !== undefined ? editionOrder[b.edition] : 2;
                if(ae !== be) return ae - be;
                var aa = awardOrder[a.award] !== undefined ? awardOrder[a.award] : 4;
                var ba = awardOrder[b.award] !== undefined ? awardOrder[b.award] : 4;
                return aa - ba;
            });
            renderWorksGrid(grid.id, sorted.slice(0, 12));
        } else {
            renderWorksGrid(grid.id, works);
        }
    });

    // Profile works
    var pw = document.getElementById('profile-works');
    if(pw){
        var creatorId = parseInt(window.location.search.match(/id=(\d+)/)?.[1] || "1");
        var mw = works.filter(function(w){return w.creator_id == creatorId});
        if(mw.length === 0) mw = works.slice(0, 4);
        mw.forEach(function(w){
            var hasV = hasBV(w.embed_id);
            var thumb = w.image_url ? '<img src="'+w.image_url+'">' : '<img src="'+DEFAULT_THUMB+'" alt="'+esc(w.title)+'" style="width:100%;height:100%;object-fit:cover">';
            var click = hasV ? 'openVideoModal(\''+esc(w.embed_id)+'\',\''+esc(w.title)+'\',\''+esc(w.description)+'\',\''+esc(w.creator_name)+'\',\''+w.creator_id+'\')' : '';
            pw.innerHTML += '<div class="video-card"'+(click ? ' onclick="'+click+'"' : '')+'><div class="thumb">'+thumb+'</div><div class="body"><h4>'+esc(w.title)+'</h4></div></div>';
        });
    }
}).catch(function(){
    [document.getElementById('works-grid'), document.getElementById('home-works-grid'), document.getElementById('vacat-works')].forEach(function(g){
        if(g) g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text3)">\u6682\u65e0\u4f5c\u54c1\u6570\u636e</div>';
    });
});

// ===== AVATAR HELPER =====
function avHtml(av, colorSmall, colorBig){
    if(av && av.length > 2 && (av.indexOf('http')===0 || av.indexOf('/')===0)){
        return '<img src="'+av+'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';
    }
    var bg = colorSmall || colorBig || '#cafe61';
    return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:'+bg+';font-size:22px;font-weight:700;color:#fff;border-radius:inherit">'+(av||'?')+'</div>';
}

// ===== RENDER CREATORS =====
window.allCreators = [];
function renderCreators(arr, limit){
    window.allCreators = arr;
    var items = limit ? arr.slice(0, limit) : arr;
    var cr = document.getElementById('home-creators');
    if(cr){
        cr.innerHTML = '';
        items.forEach(function(c, i){
            var avColor = colors[i % 6];
            cr.innerHTML += '<div class="creator-item" onclick="window.open(\'creator-profile.html?id='+c.id+'\',\'_self\')"><div class="av" style="background:'+avColor+'">'+avHtml(c.av || c.avatar, avColor)+'</div><h4>'+c.name+'</h4><span class="badge-sm badge-'+c.lv+'">'+levelNames[c.lv]+'</span></div>';
        });
    }
    var cg = document.getElementById('creators-grid');
    if(cg){ window.filterCreators(1); }
}

// ===== EVENTS =====
var ev = document.getElementById('events-list');
if(ev){
    var eds = [{d:"28",m:"6\u6708",t:"AI\u89c6\u89c9\u521b\u4f5c\u8005\u5206\u4eab\u4f1a",l:"\u4e0a\u6d77",s:"AI\u77ed\u5267\u521b\u4f5c\u5b9e\u6218\u5206\u4eab"},{d:"5",m:"7\u6708",t:"\u7b2c\u4e09\u5c4a\u74e6\u5361\u5956\u521b\u4f5c\u8425",l:"\u6df1\u5733",s:"\u4e09\u5929\u4e24\u591c"},{d:"12",m:"7\u6708",t:"AI\u89c6\u89c9\u884c\u4e1a\u52a8\u6001\u76f4\u64ad",l:"\u7ebf\u4e0a",s:"\u4e00\u5468\u65b0\u95fb\u5feb\u8bc4"},{d:"20",m:"7\u6708",t:"\u8d85\u7ea7\u521b\u4f5c\u8005\u5927\u4f1a",l:"\u5317\u4eac",s:"\u9996\u5c4a\u76db\u5178"}];
    eds.forEach(function(e){
        ev.innerHTML += '<div class="video-card" style="display:flex;padding:16px;align-items:center;"><div style="flex-shrink:0;width:60px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--gold)">'+e.d+'</div><div style="font-size:11px;color:var(--text3)">'+e.m+'</div></div><div style="margin-left:16px;flex:1"><h4 style="font-size:14px;font-weight:600">'+e.t+'</h4><p style="font-size:12px;color:var(--text3);margin-top:4px">'+e.s+'</p></div></div>';
    });
}

// ===== REFERRAL CREATORS SELECT =====
fetch(API+'/api/creators').then(function(r){return r.json()}).then(function(data){
    var sel = document.getElementById('ref_creator');
    if(sel){ sel.innerHTML = '<option value="">\u4e0d\u6307\u5b9a</option>'; data.forEach(function(c){sel.innerHTML += '<option value="'+c.name+'">'+c.name+'</option>';}); }
}).catch(function(e){console.error("Async error:",e);});

// ===== REFERRAL FORM =====
var rf = document.getElementById('referralForm');
if(rf) rf.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = rf.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '\u63d0\u4ea4\u4e2d...';
    fetch(API+'/api/referrals', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            company: document.getElementById('ref_company').value,
            name: document.getElementById('ref_name').value,
            contact: document.getElementById('ref_contact').value,
            direction: document.getElementById('ref_direction').value,
            budget: document.getElementById('ref_budget').value,
            timeline: document.getElementById('ref_timeline').value,
            description: document.getElementById('ref_desc').value,
            creator: document.getElementById('ref_creator').value || ''
        })
    }).then(function(r){return r.json()}).then(function(d){
        if(d.success){ document.getElementById('formSuccess').style.display = 'block'; rf.style.display = 'none'; }
        else alert('\u63d0\u4ea4\u5931\u8d25');
        btn.disabled = false; btn.textContent = '\u63d0\u4ea4\u5f15\u8350\u7533\u8bf7';
    }).catch(function(){alert('\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25'); btn.disabled = false; btn.textContent = '\u63d0\u4ea4\u5f15\u8350\u7533\u8bf7';});
});

// ===== REGISTER =====
var rg = document.getElementById('registerForm');
if(rg) rg.addEventListener('submit', function(e){
    e.preventDefault();
    fetch(API+'/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        name: document.getElementById('reg_name').value,
        email: document.getElementById('reg_email').value,
        password: document.getElementById('reg_password').value
    })}).then(function(r){return r.json()}).then(function(d){
        if(d.token){ localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); window.location.href = 'my-profile.html'; }
        else alert(d.error || '\u6ce8\u518c\u5931\u8d25');
    }).catch(function(){alert('\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25');});
});

// ===== LOGIN =====
var lf = document.getElementById('loginForm');
if(lf) lf.addEventListener('submit', function(e){
    e.preventDefault();
    fetch(API+'/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        email: document.getElementById('login_email').value,
        password: document.getElementById('login_password').value
    })}).then(function(r){return r.json()}).then(function(d){
        if(d.token){ localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); window.location.href = 'my-profile.html'; }
        else alert(d.error || '\u767b\u5f55\u5931\u8d25');
    }).catch(function(){alert('\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25');});
});

// ===== SAVE PROFILE =====
window.saveProfile = function(){
    var t = localStorage.getItem('token');
    if(!t) return alert('\u8bf7\u5148\u767b\u5f55');
    fetch(API+'/api/profile', {method:'PUT', headers:{'Content-Type':'application/json','Authorization':'Bearer '+t}, body:JSON.stringify({
        name: document.getElementById('profile_name')?.value || '',
        bio: document.getElementById('profile_bio')?.value || '',
        specialty: document.getElementById('profile_specialty')?.value || '',
        status: document.getElementById('profile_status')?.value || 'active',
        contact: document.getElementById('profile_contact')?.value || ''
    })}).then(function(r){return r.json()}).then(function(d){
        alert(d.success ? '\u4fdd\u5b58\u6210\u529f' : d.error || '\u4fdd\u5b58\u5931\u8d25');
    }).catch(function(){alert('\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25');});
};

// ===== REDIRECT IF LOGGED IN =====
var tk = localStorage.getItem('token');
if(tk && (window.location.pathname.includes('login') || window.location.pathname.includes('register'))) window.location.href = 'my-profile.html';

// ===== STATS COUNTER ANIMATION =====
(function(){
    var statSelectors = ['[data-c="home.stats_works"]', '[data-c="home.stats_finalists"]', '[data-c="home.stats_schools"]'];
    var checkInterval = setInterval(function(){
        var els = statSelectors.map(function(s){return document.querySelector(s);});
        var ready = els.every(function(el){return el && el.textContent && el.textContent.length > 0 && /[0-9]/.test(el.textContent);});
        if(!ready) return;
        clearInterval(checkInterval);
        var finalValues = els.map(function(el){return parseInt(el.textContent.replace(/,/g, ''));});
        var duration = 1000;
        var startTime = null;
        function step(ts){
            if(!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            els.forEach(function(el, i){
                var n = Math.round(eased * finalValues[i]);
                el.textContent = n.toLocaleString('en-US');
            });
            if(p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }, 100);
})();

})();
