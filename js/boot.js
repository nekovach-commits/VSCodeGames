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
    canvas.width = CHAR_COLS*CHAR_W*pixelSize;
    canvas.height = CHAR_ROWS*CHAR_H*pixelSize;
    canvas.dataset.pixelSize = pixelSize;
  }
  const params = new URLSearchParams(window.location.search);
  const forceSimple = params.get('mode') === 'simple';
  const isKindle = /Kindle|Silk|KF|ColorSoft/i.test(navigator.userAgent) || forceSimple;
  function loadScript(src, type='text/javascript'){
    return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=src; s.type=type; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  }
  async function start(){
    try {
      if(!isKindle){
        const mod = await import('./trs80-main.js');
        if(mod && mod.TRS80System){
          const sys = new mod.TRS80System();
          window.TRS80System = mod.TRS80System; // expose class
          // global alias similar to previous pattern
          window.trs80 = window.trs80 || { display: sys.display, keyboard: sys.keyboard, basic: sys.basic, font: mod, system: sys };
          return;
        }
      }
      // Fallback path or if advanced failed
      await loadScript('js/simple-trs80.js');
      if(window.SimpleTRS80){ new window.SimpleTRS80(canvas, pixelSize); }
    } catch(e){
      console.error('Boot failure, attempting fallback', e);
      if(!window.SimpleTRS80){
        await loadScript('js/simple-trs80.js');
        if(window.SimpleTRS80){ new window.SimpleTRS80(canvas, pixelSize); }
      }
    }
  }
  start();
})();