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
  const isOldBrowser = !window.Promise || !window.fetch || typeof Symbol === 'undefined';
  function loadScript(src, type='text/javascript'){
    return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=src; s.type=type; s.onload=resolve; s.onerror=(e)=>reject(new Error('Failed to load '+src)); document.head.appendChild(s); });
  }
  function updateStatus(text, color){
    try{
      const el = document.getElementById('status-msg');
      if (el){ el.textContent = 'System Status: ' + text; if(color) el.style.color = color; }
    }catch(_){/* no-op */}
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
      // Skip advanced system only for old browsers - Kindle ColorSoft can handle it
      if(isOldBrowser) {
        console.log('Older browser detected - using simple canvas system');
      } else {
        // Try advanced system for modern browsers (including Kindle ColorSoft)
        if(isKindle) {
          console.log('Kindle ColorSoft detected - using advanced system with input field integration');
        } else {
          console.log('Modern browser detected - loading advanced system...');
        }
        try {
          // Load advanced system using script tags (avoiding ES6 modules for now)
          await loadScript('js/trs80-config.js');
          await loadScript('js/trs80-font-vertical.js'); // FONT_DATA_VERTICAL + drawChar
          // await loadScript('js/trs80-font.js'); // not needed; consolidated into vertical file
          await loadScript('js/trs80-display.js');
          await loadScript('js/trs80-keyboard.js');
          await loadScript('js/trs80-basic.js');
          await loadScript('js/trs80-main.js');
          
          if(window.TRS80System){
            console.log('Creating TRS80System instance...');
            const sys = new window.TRS80System();
            window.trs80 = { display: sys.display, keyboard: sys.keyboard, basic: sys.basic, system: sys };
            console.log('✓ Advanced system loaded and running');
            return;
          } else {
            console.error('TRS80System class not found');
            throw new Error('TRS80System not available');
          }
        } catch(advancedError) {
          console.error('Advanced system failed to load:', advancedError);
          if (advancedError && advancedError.stack) console.error('Error details:', advancedError.stack);
          console.warn('Falling back to simple system for all devices (including Kindle)...');
          updateStatus('Advanced failed, using simple renderer', '#cc6600');
        }
      }
  // Load font data for fallback renderer
  console.log('Loading font data...');
  // Prefer vertical font (enables same glyphs for simple renderer); GRPH remains optional
  try { await loadScript('js/trs80-font-vertical.js'); } catch(_) {}
  // Legacy FONT_DATA no longer needed; keep GRPH for optional compatibility
  await loadScript('js/trs80-font-grph.js');
      if(window.FONT_DATA && window.FONT_DATA_GRPH){
        window.FONT_DATA = Object.assign({}, window.FONT_DATA, window.FONT_DATA_GRPH);
        console.log('✓ Font data and GRPH data loaded and merged');
      } else {
        console.error('Font data or GRPH data failed to load');
      }

      // Canvas renderer for all devices (Kindle, desktop, mobile)
      console.log('Loading canvas renderer...');
      updateStatus('Starting simple canvas renderer…', '#006600');
      await loadScript('js/simple-trs80.js');
      if(window.SimpleTRS80){ 
        new window.SimpleTRS80(canvas, pixelSize); 
        console.log('✓ Canvas renderer loaded successfully');
        updateStatus('Ready', '#006600');
      } else {
        console.error('SimpleTRS80 class not found');
        updateStatus('Renderer error', '#cc0000');
      }
    } catch(e){
      console.error('Boot failure:', e);
      updateStatus('Boot failure', '#cc0000');
      document.body.innerHTML += '<div style="color:red;font-family:monospace;padding:20px;">BOOT FAILURE: ' + (e && e.message ? e.message : e) + '</div>';
    }
  }
  start();
})();