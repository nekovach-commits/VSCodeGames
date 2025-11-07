      // Indicate system version in debug area (run immediately, retry if not found)
      function setSystemVersionLabel() {
        var sysVer = document.getElementById('system-version');
        if (sysVer) {
          sysVer.textContent = 'Simple Renderer';
        } else {
          // Retry after DOM is ready
          setTimeout(setSystemVersionLabel, 100);
        }
      }
      setSystemVersionLabel();
// SimpleTRS80 fallback implementation
// Minimal text-only renderer using 6x8 cells directly on the canvas
(function(){
  const CHAR_W=6, CHAR_H=8, COLS=40, ROWS=20;
  // Merge GRPH font data if available
  const FONT = Object.assign({}, window.FONT_DATA, window.FONT_DATA_GRPH || {});
  const VFONT = window.FONT_DATA_VERTICAL || null;
  const VCONV_CACHE = new Map();
  // 16-color palette (C64-like), indices 0..15
  const COLORS = [
    '#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
    '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb'
  ];
  
  // Emergency fallback font data for basic characters if FONT_DATA fails
  // Using 5-pixel wide patterns (bits 7-3) to leave space for proper character spacing
  const FALLBACK_FONT = {
    'R': [0x3C, 0x66, 0x66, 0x3C, 0x36, 0x66, 0x66, 0x00], // R with spacing
    'E': [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00], // E with spacing  
    'A': [0x18, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00], // A with spacing
    'D': [0x7C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x7C, 0x00], // D with spacing
    'Y': [0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x18, 0x00], // Y with spacing
    ']': [0x3C, 0x0C, 0x0C, 0x0C, 0x0C, 0x0C, 0x3C, 0x00], // ] bracket
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  };
  

  
  function vToRows(cols){
    // cols: length-6 array where each value has 8 bits of vertical pixels (LSB = row0)
    const rows = new Array(8).fill(0);
    for (let row=0; row<8; row++){
      let bits = 0;
      for (let col=0; col<6; col++){
        if (cols[col] & (1<<row)) bits |= (1<<(5-col));
      }
      rows[row] = bits;
    }
    return rows;
  }
  function getGlyph(ch){
    // Prefer vertical font if available
    if (VFONT){
      const v = VFONT[ch] || VFONT[String.fromCharCode(ch.charCodeAt(0))];
      if (v){
        if (!VCONV_CACHE.has(ch)) VCONV_CACHE.set(ch, vToRows(v));
        return VCONV_CACHE.get(ch);
      }
    }
    // Support all codes 1-255 (CHR$)
    const code = ch.charCodeAt(0);
    if (FONT[String.fromCharCode(code)]) return FONT[String.fromCharCode(code)];
    // Fallback font for basic ASCII if needed
    if (FALLBACK_FONT[ch]) return FALLBACK_FONT[ch];
    // Last resort - return a simple block
    return [0x7F, 0x41, 0x41, 0x41, 0x41, 0x41, 0x7F, 0x00];
  }
  class SimpleTRS80 {
    constructor(canvas, pixelSize){
      this.canvas = canvas || document.getElementById('retro-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.pixelSize = pixelSize || parseInt(this.canvas.dataset.pixelSize||'2',10);
      this.cols=COLS; this.rows=ROWS;
      this.cursorX=0; this.cursorY=0;
      this.buffer = Array.from({length: ROWS},()=>Array(COLS).fill(' '));
      // Minimal graphics/color state for BASIC compatibility
      this.currentPixelColor = '#000000';
      this.currentBackgroundColor = '#ffffff';
  this.ctx.imageSmoothingEnabled=false;
  
  // Color support (Kindle Colorsoft supports color)
  this.isKindle = /Kindle|Silk|KF|ColorSoft/i.test(navigator.userAgent);
  this.textColor = COLORS[14]; // default light blue
  this.bgColor = COLORS[1];    // white
  this.cellBg = this.bgColor;
  // Current color indices (for graphics)
  this.currentPixelColorIndex = 14;
  this.currentBackgroundColorIndex = 1;
  this.currentPixelColor = this.currentPixelColorIndex;
  this.currentBackgroundColor = this.currentBackgroundColorIndex;

  // Graphics buffer (drawn beneath text)
  this.gw = COLS*CHAR_W; // 240
  this.gh = ROWS*CHAR_H; // 160
  this.gbuf = Array.from({length: this.gh}, () => new Uint8Array(this.gw));

  this.cursorVisible = true;
  this.lastBlink = Date.now();
  this.fullRedraw();
  // Initial READY banner similar to advanced system
  this.printText('READY\n');
  this.putChar(']'); // Add BASIC prompt like desktop version
  this.fullRedraw();
      

      // Input handling: desktop uses keyboard, Kindle uses input field
      if(!this.isKindle) {
  window.addEventListener('keydown', e=>this.onKey(e));
      }
  // Kindle-specific input field handler (minimal tweak)
  if(this.isKindle) this.setupInputHandling();

      // Kindle-specific canvas tweaks (minimal)
      if(this.isKindle) {
        // Force integer scaling for e-ink
        this.pixelSize = Math.max(1, Math.floor(this.pixelSize));
        // Ensure crisp rendering
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = 'crisp-edges';
      }
      
      // Start cursor blink timer for all devices
      setInterval(() => {
        // Force redraw of current cursor cell to toggle underline
        this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
      }, 300); // Slightly slower for e-ink visibility
      

    }
    onKey(e){
      if(e.key.length===1){ this.putChar(e.key); }
      else if(e.key==='Enter'){ this.newLine(); }
      else if(e.key==='Backspace'){ 
        // Only handle backspace once per keypress
        this.backspace(); 
        e.preventDefault(); 
      }
    }
    // BASIC display compatibility layer
    addChar(ch){
      if (ch === '\n') { this.newLine(); return; }
      this.putChar(ch);
    }
    moveCursorTo(col, row) {
      const prevX = this.cursorX, prevY = this.cursorY;
      this.cursorX = Math.max(0, Math.min(this.cols-1, col|0));
      this.cursorY = Math.max(0, Math.min(this.rows-1, row|0));
      // Redraw previous and new cursor cells
      this.drawCell(prevX, prevY, this.buffer[prevY][prevX]);
      this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
    }
    setBackgroundColor(index){
      const ci = (index|0) & 15;
      const bg = COLORS[ci] || COLORS[1];
      this.cellBg = bg;
      this.currentBackgroundColorIndex = ci;
      this.currentBackgroundColor = ci;
      // Don't redraw everything - just update cell background for future characters
    }
    // Graphics implementation (monochrome) under text
    _setG(x,y,val){ if(x>=0&&y>=0&&x<this.gw&&y<this.gh){ this.gbuf[y][x]=val?1:0; } }
    _getG(x,y){ return (x>=0&&y>=0&&x<this.gw&&y<this.gh) ? this.gbuf[y][x] : 0; }
    _redrawCellForPixel(x,y){ const cx = Math.floor(x/CHAR_W), cy = Math.floor(y/CHAR_H); if(cx>=0&&cy>=0&&cx<this.cols&&cy<this.rows){ this.drawCell(cx,cy,this.buffer[cy][cx]); } }
    drawPixel(x, y, color) { const ci = (typeof color==='number')? (color&15) : this.currentPixelColorIndex; this._setG(x|0, y|0, ci); this._redrawCellForPixel(x|0, y|0); }
    drawLine(x1, y1, x2, y2, color) {
      const ci = (typeof color==='number')? (color&15) : this.currentPixelColorIndex;
      x1|=0; y1|=0; x2|=0; y2|=0;
      let dx = Math.abs(x2-x1), sx = x1<x2?1:-1;
      let dy = -Math.abs(y2-y1), sy = y1<y2?1:-1; let err = dx+dy;
      while(true){ this._setG(x1,y1,ci); this._redrawCellForPixel(x1,y1); if(x1===x2&&y1===y2) break; const e2=2*err; if(e2>=dy){ err+=dy; x1+=sx; } if(e2<=dx){ err+=dx; y1+=sy; } }
    }
    drawRect(x1, y1, x2, y2, filled=false, color) {
      const ci = (typeof color==='number')? (color&15) : this.currentPixelColorIndex;
      x1|=0; y1|=0; x2|=0; y2|=0; if(x1>x2){const t=x1;x1=x2;x2=t;} if(y1>y2){const t=y1;y1=y2;y2=t;}
      if(filled){ for(let y=y1;y<=y2;y++){ for(let x=x1;x<=x2;x++){ this._setG(x,y,ci); } } }
      else { for(let x=x1;x<=x2;x++){ this._setG(x,y1,ci); this._setG(x,y2,ci);} for(let y=y1;y<=y2;y++){ this._setG(x1,y,ci); this._setG(x2,y,ci);} }
      // Redraw impacted cells
      this._redrawCellForPixel(x1,y1); this._redrawCellForPixel(x2,y2);
    }
    drawCircle(cx, cy, r, filled=false) {
      const ci = this.currentPixelColorIndex;
      cx|=0; cy|=0; r|=0; let x=r, y=0, err=0;
      const plot=(px,py)=>{ this._setG(px,py,ci); this._redrawCellForPixel(px,py); };
      while(x>=y){
        if(filled){ for(let ix=cx-x; ix<=cx+x; ix++){ this._setG(ix, cy+y,ci); this._setG(ix, cy-y,ci);} for(let ix=cx-y; ix<=cx+y; ix++){ this._setG(ix, cy+x,ci); this._setG(ix, cy-x,ci);} }
        else { plot(cx+x, cy+y); plot(cx+y, cy+x); plot(cx-y, cy+x); plot(cx-x, cy+y); plot(cx-x, cy-y); plot(cx-y, cy-x); plot(cx+y, cy-x); plot(cx+x, cy-y); }
        y++; if(err<=0){ err+=2*y+1; } if(err>0){ x--; err-=2*x+1; }
      }
    }
    floodFill(x, y) {
      x|=0; y|=0; if(this._getG(x,y)) return; const w=this.gw,h=this.gh; const q=[[x,y]]; const seen=new Set();
      const key=(a,b)=>a+','+b; seen.add(key(x,y)); const ci = this.currentPixelColorIndex;
      while(q.length){ const p=q.pop(); const cx=p[0], cy=p[1]; if(cx<0||cy<0||cx>=w||cy>=h) continue; if(this._getG(cx,cy)) continue; this._setG(cx,cy,ci); this._redrawCellForPixel(cx,cy);
        const n=[[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]; for(let i=0;i<4;i++){ const nx=n[i][0], ny=n[i][1]; const k=key(nx,ny); if(nx>=0&&ny>=0&&nx<w&&ny<h&&!seen.has(k)&&!this._getG(nx,ny)){ seen.add(k); q.push([nx,ny]); } }
      }
    }
    clearGraphics() { for(let y=0;y<this.gh;y++){ this.gbuf[y].fill(0);} this.fullRedraw(); }
    putChar(ch){
      // Save previous cursor position
      const prevX = this.cursorX, prevY = this.cursorY;
      // Write character to buffer at previous position
      this.buffer[prevY][prevX] = ch;
      // Advance cursor
      this.cursorX++;
      if (this.cursorX >= this.cols) {
        this.newLine();
      }
      // Redraw previous cell WITHOUT cursor underline (cursor moved)
      this.drawCell(prevX, prevY, this.buffer[prevY][prevX]);
      // Redraw current cursor cell (may be space)
      this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
    }
    backspace(){
      if(this.cursorX>0){ 
        this.cursorX--; 
        this.buffer[this.cursorY][this.cursorX]=' '; 
        this.drawCell(this.cursorX,this.cursorY,' '); // This will also draw cursor since we're at cursor position
      }
    }
    newLine(){
      this.cursorX=0; this.cursorY++;
      if(this.cursorY>=this.rows){
        this.buffer.shift();
        this.buffer.push(Array(this.cols).fill(' '));
        this.cursorY=this.rows-1;
        this.fullRedraw();
      } else {
        // Redraw cursor at new line position
        this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
      }
    }
    fullRedraw(){
      // Clear background
      this.ctx.fillStyle=this.bgColor;
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      
      // Force sharp pixel rendering for e-ink
      this.ctx.imageSmoothingEnabled = false;
      if(this.ctx.webkitImageSmoothingEnabled !== undefined) {
        this.ctx.webkitImageSmoothingEnabled = false;
      }
      if(this.ctx.mozImageSmoothingEnabled !== undefined) {
        this.ctx.mozImageSmoothingEnabled = false;
      }
      
      // Redraw all cells
      for(let y=0;y<this.rows;y++) {
        for(let x=0;x<this.cols;x++) {
          this.drawCell(x,y,this.buffer[y][x]);
        }
      }
    }
    drawCell(cx,cy,ch){
      const glyph=getGlyph(ch);
      const pxSize=this.pixelSize;
      const x0=cx*CHAR_W*pxSize; const y0=cy*CHAR_H*pxSize;
      
      // Clear cell background
      this.ctx.fillStyle=this.cellBg;
      this.ctx.fillRect(x0,y0,CHAR_W*pxSize,CHAR_H*pxSize);

      // Draw graphics layer under text for this cell region
      const gxStart = cx*CHAR_W, gxEnd = gxStart + CHAR_W;
      const gyStart = cy*CHAR_H, gyEnd = gyStart + CHAR_H;
      const effectivePixelSize = this.isKindle ? Math.max(1, Math.floor(pxSize)) : pxSize;
      for (let gy = gyStart; gy < gyEnd; gy++) {
        const row = this.gbuf[gy];
        if (!row) continue;
        for (let gx = gxStart; gx < gxEnd; gx++) {
          const ci = row[gx] | 0;
          if (ci) {
            this.ctx.fillStyle = COLORS[ci] || '#000000';
            const px = Math.floor(x0 + (gx - gxStart) * effectivePixelSize);
            const py = Math.floor(y0 + (gy - gyStart) * effectivePixelSize);
            this.ctx.fillRect(px, py, effectivePixelSize, effectivePixelSize);
          }
        }
      }
      
      // Draw character pixels with high contrast (skip if space and not at cursor)
      const isCursor = (this.cursorX===cx && this.cursorY===cy);
      if(ch !== ' ' || isCursor){
        this.ctx.fillStyle=this.textColor;
        
        if(ch !== ' '){
          for(let row=0; row<CHAR_H; row++){
            const bits = glyph[row] || 0;
            for(let col=0; col<CHAR_W; col++){
              if(bits & (1 << (5-col))){
                // Use integer coordinates for crisp pixels on e-ink
                const px = Math.floor(x0+col*effectivePixelSize);
                const py = Math.floor(y0+row*effectivePixelSize);
                this.ctx.fillRect(px, py, effectivePixelSize, effectivePixelSize);
              }
            }
          }
        }
      }
      
      // Cursor rendering - solid block for visibility on e-ink
      if(isCursor){
        // Blinking block cursor
        const now=Date.now();
        if(now - this.lastBlink > 400){ this.cursorVisible=!this.cursorVisible; this.lastBlink=now; }
        if(this.cursorVisible){
          // Draw full block in text color
          this.ctx.fillStyle=this.textColor;
          this.ctx.fillRect(x0, y0, CHAR_W*effectivePixelSize, CHAR_H*effectivePixelSize);
        }
      }
    }
    
    setupInputHandling(){
      console.log('Setting up input handling for canvas renderer...');
      
      // Kindle input field integration
      const kindleInput = document.getElementById('kindle-input');
      if(kindleInput) {
        console.log('Found Kindle input field, setting up handlers...');
        
        let inputBuffer = '';
        let currentLine = '';
        
        // Handle input events from Kindle input field
        kindleInput.addEventListener('input', (e) => {
          const newValue = e.target.value;
          console.log('🔹 Kindle input event - value:', newValue, 'buffer:', inputBuffer);
          
          // Find what was added (handle typing and pasting)
          if (newValue.length > inputBuffer.length) {
            const addedText = newValue.slice(inputBuffer.length);
            console.log('🔹 Added text:', addedText);
            for (let char of addedText) {
              console.log('🔹 Processing char:', char);
              currentLine += char;
              this.putChar(char);
            }
          }
          
          // Find what was removed (backspace)
          if (newValue.length < inputBuffer.length) {
            const removedCount = inputBuffer.length - newValue.length;
            for (let i = 0; i < removedCount; i++) {
              if(currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                this.backspace();
              }
            }
          }
          
          inputBuffer = newValue;
        });
        
        // Handle Enter key for command execution
        kindleInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            console.log('Enter pressed, current line:', currentLine);
            
            // Process BASIC command if SharedBasicProcessor is available
            // Note: Don't call this.newLine() here as BASIC processor handles its own line endings
            const basic = (this.basic || window.SharedBasicProcessor);
            if (basic && currentLine.trim()) {
              const displayInterface = {
                addText: (text) => this.printText(text),
                setTextColor: (colorIndex) => this.setTextColor(colorIndex),
                clearScreen: () => this.clearScreen()
              };
              const program = new Map(); // Simple program storage
              try {
                // Prefer instance method; fall back to global if exposed
                if (typeof basic.processLine === 'function') {
                  basic.processLine(currentLine.trim());
                } else if (window.SharedBasicProcessor && typeof window.SharedBasicProcessor.processLine === 'function') {
                  window.SharedBasicProcessor.processLine(currentLine.trim());
                }
              } catch (err) {
                console.error('BASIC processing error:', err);
                this.printText('?ERROR\n');
              }
            } else if (currentLine.trim() === '') {
              // Only add newline for empty commands
              this.newLine();
            }
            

            // Always start prompt on a new line after command execution
            this.newLine();
            this.putChar(']');
            this.drawCell(this.cursorX, this.cursorY, ']'); // Ensure cursor shows at prompt
            
            currentLine = '';
            // Clear input field
            e.target.value = '';
            inputBuffer = '';
            e.preventDefault();
          }
        });
      } else {
        console.log('No Kindle input field found');
      }
    }
    
    printText(text) {
      // Print each character, handling newlines
      let lastWasNewline = false;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
          this.newLine();
          lastWasNewline = true;
        } else {
          this.putChar(text[i]);
          lastWasNewline = false;
        }
      }
      // Ensure only one newline after output
      if (!lastWasNewline) {
        this.newLine();
      }
    }
    
    setTextColor(colorIndex) {
      const ci = (colorIndex|0) & 15;
      this.textColor = COLORS[ci] || this.textColor;
      this.currentPixelColorIndex = ci;
      this.currentPixelColor = ci;
    }
    
    clearScreen() {
      this.buffer = Array.from({length: this.rows},()=>Array(this.cols).fill(' '));
      this.cursorX = 0;
      this.cursorY = 0;
      this.fullRedraw();
    }
  }
  window.SimpleTRS80 = SimpleTRS80;
})();