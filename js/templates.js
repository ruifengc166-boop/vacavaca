(function(){
var API = window.location.origin;
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function tagsHtml(tags){
  if(!Array.isArray(tags)) tags = String(tags||'').split(',').filter(Boolean);
  return tags.slice(0,4).map(function(t){return '<span class="template-tag">'+esc(t)+'</span>';}).join('');
}
function templateCard(t){
  var img = t.cover_image ? '<img src="'+esc(t.cover_image)+'" alt="'+esc(t.title)+'">' : '<span>No cover</span>';
  return '<div class="template-card"><div class="template-cover">'+img+'</div><div class="template-body"><h3>'+esc(t.title)+'</h3><p style="color:var(--text3);font-size:13px;line-height:1.65;margin-top:6px">'+esc(t.description)+'</p><div class="template-tags">'+tagsHtml(t.style_tags)+'</div><div class="template-meta"><div><strong>Industry</strong>'+esc(t.industry||'Flexible')+'</div><div><strong>Format</strong>'+esc(t.aspect_ratio||'9:16')+'</div><div><strong>Turnaround</strong>'+esc(t.turnaround||'TBD')+'</div><div><strong>Budget</strong>'+esc(t.base_price||'Custom')+'</div></div><a class="btn btn-primary btn-block" href="start.html?template_id='+encodeURIComponent(t.id)+'">Use This Style</a></div></div>';
}
function renderTemplates(items){
  var grid = document.getElementById('templatesGrid');
  if(grid){
    grid.innerHTML = items.length ? items.map(templateCard).join('') : '<div class="studio-card" style="grid-column:1/-1;text-align:center">No published templates yet.</div>';
  }
  var featured = document.getElementById('featuredTemplates');
  if(featured){
    featured.innerHTML = items.slice(0,3).map(templateCard).join('');
  }
}
fetch(API + '/api/templates').then(function(r){return r.json()}).then(function(items){
  if(!Array.isArray(items)) items = [];
  window.allStudioTemplates = items;
  renderTemplates(items);
}).catch(function(){
  renderTemplates([]);
});
})();
