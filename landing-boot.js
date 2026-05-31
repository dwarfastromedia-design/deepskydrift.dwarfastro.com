(function(){
  if(!document.querySelector('link[href^="landing.css"]')){
    var css=document.createElement('link');
    css.rel='stylesheet';
    css.href='landing.css?v=0.6.0';
    document.head.appendChild(css);
  }
  if(!document.querySelector('script[src^="schema.js"]')){
    var s=document.createElement('script');
    s.src='schema.js?v=0.6.0';
    document.head.appendChild(s);
  }
})();
