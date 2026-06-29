(function(){
var API = window.location.origin;
function qs(name){return new URLSearchParams(window.location.search).get(name)||'';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
var selectedTemplateId = qs('template_id');
var selectedTemplate = null;
function renderSelected(t){
  var box = document.getElementById('selectedTemplateBox');
  var hidden = document.getElementById('selected_template_id');
  if(hidden) hidden.value = selectedTemplateId || '';
  if(!box) return;
  if(!t){ box.innerHTML = '<div class="eyebrow">No template selected</div><h3>Custom brief</h3><p style="color:var(--text3);font-size:14px;line-height:1.7">Tell us what you want to make. We will recommend a visual direction after reviewing your product.</p><a href="templates.html" class="btn btn-secondary btn-block" style="margin-top:14px">Choose a Template</a>'; return; }
  var tags = Array.isArray(t.style_tags)?t.style_tags:[];
  box.innerHTML = '<div class="eyebrow">Selected Style</div><h3>'+esc(t.title)+'</h3><p style="color:var(--text3);font-size:14px;line-height:1.7">'+esc(t.description)+'</p><div class="template-tags">'+tags.map(function(tag){return '<span class="template-tag">'+esc(tag)+'</span>';}).join('')+'</div><div class="template-meta"><div><strong>Format</strong>'+esc(t.aspect_ratio||'9:16')+'</div><div><strong>Turnaround</strong>'+esc(t.turnaround||'TBD')+'</div><div><strong>Budget</strong>'+esc(t.base_price||'Custom')+'</div><div><strong>Industry</strong>'+esc(t.industry||'Flexible')+'</div></div><a href="templates.html" class="btn btn-secondary btn-block">Change Template</a>';
}
if(selectedTemplateId){
  fetch(API + '/api/templates/' + encodeURIComponent(selectedTemplateId)).then(function(r){return r.json()}).then(function(t){ selectedTemplate = t && t.id ? t : null; renderSelected(selectedTemplate); }).catch(function(){renderSelected(null);});
} else renderSelected(null);

async function uploadFiles(files){
  var urls = [];
  for(var i=0;i<files.length;i++){
    var fd = new FormData();
    fd.append('file', files[i]);
    var d = await fetch(API + '/api/orders/upload', {method:'POST', body:fd}).then(function(r){return r.json()});
    if(d.url) urls.push(d.url);
  }
  return urls;
}

var form = document.getElementById('startProjectForm');
if(form) form.addEventListener('submit', async function(e){
  e.preventDefault();
  var btn = form.querySelector('button[type=submit]');
  var status = document.getElementById('briefStatus');
  btn.disabled = true; btn.textContent = 'Submitting...';
  if(status){status.style.display='none';status.textContent='';}
  try{
    var fileInput = document.getElementById('assets_upload');
    var assetUrls = fileInput && fileInput.files && fileInput.files.length ? await uploadFiles(fileInput.files) : [];
    var body = {
      selected_template_id: document.getElementById('selected_template_id').value,
      company: document.getElementById('company').value,
      contact_name: document.getElementById('contact_name').value,
      email: document.getElementById('email').value,
      whatsapp: document.getElementById('whatsapp').value,
      wechat: document.getElementById('wechat').value,
      brand_website: document.getElementById('brand_website').value,
      product_name: document.getElementById('product_name').value,
      product_url: document.getElementById('product_url').value,
      target_market: document.getElementById('target_market').value,
      target_platform: Array.from(document.querySelectorAll('[name="target_platform"]:checked')).map(function(x){return x.value;}),
      budget: document.getElementById('budget').value,
      timeline: document.getElementById('timeline').value,
      product_description: document.getElementById('product_description').value,
      creative_direction: document.getElementById('creative_direction').value,
      reference_links: document.getElementById('reference_links').value,
      additional_notes: document.getElementById('additional_notes').value,
      asset_urls: assetUrls
    };
    var d = await fetch(API + '/api/orders', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}).then(function(r){return r.json()});
    if(d.success){
      form.reset();
      if(status){status.style.display='block';status.innerHTML='Your brief has been submitted. Our team will review it and contact you within 24 hours. Brief ID: <strong>#'+d.id+'</strong>';}
      window.scrollTo({top:0,behavior:'smooth'});
    } else throw new Error(d.error || 'Submit failed');
  }catch(err){
    if(status){status.style.display='block';status.textContent=err.message || 'Submit failed. Please try again.';}
  }finally{
    btn.disabled = false; btn.textContent = 'Submit Brief';
  }
});
})();
