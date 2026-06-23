// Content Loader - Fills page elements with data from CMS
(function(){
var API = window.location.origin;
fetch(API + '/api/content').then(function(r){return r.json()}).then(function(content){
    // Handle background images via data-c-bg attribute
    document.querySelectorAll('[data-c-bg]').forEach(function(el){
        var keys = el.getAttribute('data-c-bg').split('.');
        var val = content;
        for(var i=0; i<keys.length; i++){
            if(val && val[keys[i]] !== undefined) val = val[keys[i]];
            else { val = null; break; }
        }
        if(val && typeof val === 'string'){
            el.style.backgroundImage = 'url(' + val + ')';
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.style.backgroundRepeat = 'no-repeat';
        }
    });
    // Handle text/input/image content via data-c attribute
    document.querySelectorAll('[data-c]').forEach(function(el){
        var keys = el.getAttribute('data-c').split('.');
        var val = content;
        for(var i=0; i<keys.length; i++){
            if(val && val[keys[i]] !== undefined) val = val[keys[i]];
            else { val = null; break; }
        }
        if(val && typeof val === 'string'){
            if(el.tagName === 'IMG' || el.tagName === 'SOURCE'){
                el.src = val;
            } else if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'){
                el.value = val;
            } else {
                // Format: double newlines = paragraph break, single = <br>
                var formatted = val.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
                if (val.indexOf('\n') >= 0 || val.indexOf('<') >= 0) {
                    // Only wrap in <p> if there's formatting that needs it
                    if (val.indexOf('\n\n') >= 0) {
                        formatted = '<p>' + formatted + '</p>';
                    }
                }
                el.innerHTML = formatted;
            }
        }
    });
}).catch(function(){});
})();
