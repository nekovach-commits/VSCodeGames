// TRS-80 Boot Loader
// Selects advanced ES6 system or fallback simple system

(function(){
  const CHAR_COLS = 40, CHAR_ROWS = 20, CHAR_W = 6, CHAR_H = 8;
  function computePixelSize(){
    const maxW = window.innerWidth || 800;
    const maxH = window.innerHeight || 600;
    let px = 1; while((CHAR_COLS*CHAR_W*(px+1) <= maxW) && (CHAR_ROWS*CHAR_H*(px+1) <= maxH)) px++; return px;
  }
  const pixelSize = computePixelSize();
  const canvas = document.getElementById('retro-canvas');
  if(canvas){
    // Add 20px padding (10px border on each side) so characters don't get clipped
    const BORDER_PADDING = 20;
    canvas.width = CHAR_COLS*CHAR_W*pixelSize + BORDER_PADDING;
    canvas.height = CHAR_ROWS*CHAR_H*pixelSize + BORDER_PADDING;
    canvas.dataset.pixelSize = pixelSize;
  }
  const params = new URLSearchParams(window.location.search);
  const forceSimple = params.get('mode') === 'simple';
  const isKindle = /Kindle|Silk|KF|ColorSoft/i.test(navigator.userAgent) || forceSimple;
  function loadScript(src, type='text/javascript'){
    return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=src; s.type=type; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  }
  async function start(){
    // Debug info
    console.log('=== BOOT DEBUG ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Screen:', window.screen.width + 'x' + window.screen.height);
    console.log('Inner:', window.innerWidth + 'x' + window.innerHeight);
    console.log('Pixel Size:', pixelSize);
    console.log('isKindle:', isKindle);
    console.log('forceSimple:', forceSimple);
    console.log('Canvas:', canvas ? canvas.width + 'x' + canvas.height : 'NOT FOUND');
    
    try {
      if(!isKindle){
        console.log('Loading advanced system for desktop...');
        try {
          const mod = await import('./trs80-main.js');
          console.log('trs80-main.js loaded, module:', mod);
          if(mod && mod.TRS80System){
            console.log('Creating TRS80System instance...');
            const sys = new mod.TRS80System();
            window.TRS80System = mod.TRS80System; // expose class
            // global alias similar to previous pattern
            window.trs80 = window.trs80 || { display: sys.display, keyboard: sys.keyboard, basic: sys.basic, font: mod, system: sys };
            console.log('✓ Advanced system loaded and running');
            return;
          } else {
            console.error('TRS80System class not found in module');
          }
        } catch(advancedError) {
          console.error('Advanced system failed to load:', advancedError);
          console.log('Falling back to simple system...');
        }
      } else {
        console.log('Kindle detected, skipping advanced system');
      }
      // Load font data first - required by all renderers
      console.log('Loading font data...');
      await loadScript('js/trs80-font.js');
      if(window.FONT_DATA){
        console.log('✓ Font data loaded successfully');
      } else {
        console.error('Font data failed to load');
      }
      
      // Load shared BASIC processor second - required by all renderers
      console.log('Loading shared BASIC processor...');
      await loadScript('js/shared-basic.js');
      if(window.SharedBasicProcessor){
        console.log('✓ SharedBasicProcessor loaded successfully');
      } else {
        console.error('SharedBasicProcessor failed to load');
      }
      
      // Canvas renderer for all devices (Kindle, desktop, mobile)
      console.log('Loading canvas renderer...');
      await loadScript('js/simple-trs80.js');
      if(window.SimpleTRS80){ 
        new window.SimpleTRS80(canvas, pixelSize); 
        console.log('✓ Canvas renderer loaded successfully');
      } else {
        console.error('SimpleTRS80 class not found');
      }
    } catch(e){
      console.error('Boot failure, attempting emergency fallback', e);
      if(!window.SimpleTRS80){
        try {
          // Load font data for emergency fallback too
          if(!window.FONT_DATA){
            await loadScript('js/trs80-font.js');
          }
          // Load BASIC processor for emergency fallback too
          if(!window.SharedBasicProcessor){
            await loadScript('js/shared-basic.js');
          }
          await loadScript('js/simple-trs80.js');
          if(window.SimpleTRS80){ 
            new window.SimpleTRS80(canvas, pixelSize); 
            console.log('✓ Emergency canvas fallback loaded');
          }
        } catch(e2) {
          console.error('All fallbacks failed:', e2);
          document.body.innerHTML += '<div style="color:red;font-family:monospace;padding:20px;">BOOT FAILURE: ' + e.message + '</div>';
        }
      }
    }
  }
  start();
})();