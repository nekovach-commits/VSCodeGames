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
      if(!window.SimpleTRS80){
        console.warn('SimpleTRS80 class not found after loading file. Defining ultra-simple ES5 fallback.');
        updateStatus('Using ultra-simple ES5 renderer', '#cc6600');
        // Ultra-simple ES5 renderer (no classes/arrow/let/const)
        (function(){
          function SimpleTRS80ES5(cvs, px){
            var self = this;
            self.canvas = cvs || document.getElementById('retro-canvas');
            self.ctx = self.canvas.getContext('2d');
            self.pixelSize = px || parseInt(self.canvas && self.canvas.getAttribute('data-pixel-size') || '2', 10);
            self.cols = 40; self.rows = 20; self.cursorX = 0; self.cursorY = 0;
            self.textColor = '#000000'; self.bgColor = '#ffffff';
            self.buffer = [];
            for (var r=0;r<self.rows;r++){ var row=[]; for(var c=0;c<self.cols;c++) row.push(' '); self.buffer.push(row); }
            self.ctx.fillStyle = self.bgColor; self.ctx.fillRect(0,0,self.canvas.width,self.canvas.height);
            self.cursorVisible = true; self.lastBlink = Date.now();
            setInterval(function(){ self.drawCell(self.cursorX, self.cursorY, self.buffer[self.cursorY][self.cursorX]); }, 400);
            self.printText('READY\n'); self.putChar(']');
            var inp = document.getElementById('kindle-input');
            if (inp){
              var line = ''; var prev = '';
              inp.addEventListener('input', function(e){
                var v = e.target.value; if(v.length>prev.length){ var add=v.slice(prev.length); for(var i=0;i<add.length;i++){ self.putChar(add.charAt(i)); line+=add.charAt(i);} }
                else if(v.length<prev.length){ var rem=prev.length-v.length; while(rem-->0){ self.backspace(); line = line.slice(0, -1);} }
                prev = v;
              });
              inp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ try{ if (window.SharedBasicProcessor && line.replace(/\s+/g,'')) { window.SharedBasicProcessor.processLine(line); } }catch(err){ }
                self.newLine(); self.putChar(']'); e.target.value=''; prev=''; line=''; e.preventDefault(); } });
            }
          }
          SimpleTRS80ES5.prototype.drawCell = function(cx,cy,ch){
            var ps=this.pixelSize, x0=cx*6*ps, y0=cy*8*ps;
            this.ctx.fillStyle=this.bgColor; this.ctx.fillRect(x0,y0,6*ps,8*ps);
            // underline cursor
            if (this.cursorX===cx && this.cursorY===cy){ var now=Date.now(); if(now-this.lastBlink>500){ this.cursorVisible=!this.cursorVisible; this.lastBlink=now; }
              if(this.cursorVisible){ this.ctx.fillStyle=this.textColor; this.ctx.fillRect(x0, y0+7*ps, 6*ps, ps); }
            }
            if(ch===' ') return; this.ctx.fillStyle=this.textColor; this.ctx.fillRect(x0+ps, y0+ps, ps, ps); // very simple block for visibility
          };
          SimpleTRS80ES5.prototype.putChar = function(ch){ var px=this.cursorX, py=this.cursorY; this.buffer[py][px]=ch; this.cursorX++; if(this.cursorX>=this.cols) this.newLine(); this.drawCell(px,py,ch); this.drawCell(this.cursorX,this.cursorY,this.buffer[this.cursorY][this.cursorX]); };
          SimpleTRS80ES5.prototype.newLine = function(){ this.cursorX=0; this.cursorY++; if(this.cursorY>=this.rows){ this.buffer.shift(); var row=[]; for(var c=0;c<this.cols;c++) row.push(' '); this.buffer.push(row); this.cursorY=this.rows-1; } };
          SimpleTRS80ES5.prototype.backspace = function(){ if(this.cursorX>0){ this.cursorX--; this.buffer[this.cursorY][this.cursorX]=' '; this.drawCell(this.cursorX,this.cursorY,' ');} };
          SimpleTRS80ES5.prototype.printText = function(t){ for(var i=0;i<t.length;i++){ if(t.charAt(i)==='\n') this.newLine(); else this.putChar(t.charAt(i)); } };
          window.SimpleTRS80 = SimpleTRS80ES5;
        })();
      }

      // Create simple renderer instance first
      const simple = new window.SimpleTRS80(canvas, pixelSize);
      console.log('✓ Canvas renderer loaded successfully');

      // Load BASIC interpreter and wire to simple renderer
      console.log('Loading BASIC interpreter...');
      await loadScript('js/trs80-config.js');
      await loadScript('js/trs80-basic.js');
      if(window.TRS80Basic){
        const basicInstance = new window.TRS80Basic(simple, /*keyboard*/ null);
        // Expose to simple renderer and global for compatibility
        simple.basic = basicInstance;
        window.SharedBasicProcessor = basicInstance;
        console.log('✓ BASIC interpreter loaded and wired to simple renderer');
      } else {
        console.error('TRS80Basic class not found');
      }

      updateStatus('Ready', '#006600');
    } catch(e){
      console.error('Boot failure:', e);
      updateStatus('Boot failure', '#cc0000');
      document.body.innerHTML += '<div style="color:red;font-family:monospace;padding:20px;">BOOT FAILURE: ' + (e && e.message ? e.message : e) + '</div>';
    }
  }
  start();
})();