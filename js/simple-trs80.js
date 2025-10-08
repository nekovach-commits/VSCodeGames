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
  

  
  function getGlyph(ch){

    
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
  this.ctx.imageSmoothingEnabled=false;
  
  // Use same colors as advanced system for all devices (including Kindle ColorSoft)
  this.isKindle = /Kindle|Silk|KF|ColorSoft/i.test(navigator.userAgent);
  this.textColor = '#0066cc'; // Same light blue as desktop for all devices
  this.bgColor = '#ffffff';   // White background
  this.cellBg = '#ffffff';    // White cells
  

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
      this.setupInputHandling();

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
        this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
      }, 100); // Redraw cursor position every 100ms to ensure blinking works
      

    }
    onKey(e){
      if(e.key.length===1){ this.putChar(e.key); }
      else if(e.key==='Enter'){ this.newLine(); }
      else if(e.key==='Backspace'){ this.backspace(); e.preventDefault(); }
    }
    putChar(ch){
      this.buffer[this.cursorY][this.cursorX]=ch;
      this.drawCell(this.cursorX,this.cursorY,ch);
      this.cursorX++;
      if(this.cursorX>=this.cols){ 
        this.newLine(); 
      } else {
        // Redraw cursor at new position
        this.drawCell(this.cursorX, this.cursorY, this.buffer[this.cursorY][this.cursorX]);
      }
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
      
      // Debug glyph data for troubleshooting
      debugGlyph(ch, glyph);
      
      // Clear cell background
      this.ctx.fillStyle=this.cellBg;
      this.ctx.fillRect(x0,y0,CHAR_W*pxSize,CHAR_H*pxSize);
      
      // Skip drawing for spaces
      if(ch === ' ') return;
      
      // Draw character pixels with high contrast
      this.ctx.fillStyle=this.textColor;
      
      // Kindle-specific pixel size adjustment
      const effectivePixelSize = this.isKindle ? Math.max(1, Math.floor(pxSize)) : pxSize;
      
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
      
      // Cursor rendering - same for all devices (including Kindle ColorSoft)
      if(this.cursorX===cx && this.cursorY===cy){
        this.ctx.fillStyle=this.textColor;
        
        // Blinking underline cursor for all devices (Kindle ColorSoft can handle this)
        const now=Date.now();
        if(now - this.lastBlink > 500){ this.cursorVisible=!this.cursorVisible; this.lastBlink=now; }
        if(this.cursorVisible){
          this.ctx.fillRect(x0, y0+ (CHAR_H-1)*pxSize, CHAR_W*pxSize, pxSize);
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
            if (window.SharedBasicProcessor && currentLine.trim()) {
              const displayInterface = {
                addText: (text) => this.printText(text),
                setTextColor: (colorIndex) => this.setTextColor(colorIndex),
                clearScreen: () => this.clearScreen()
              };
              const program = new Map(); // Simple program storage
              window.SharedBasicProcessor.processLine(currentLine.trim(), program, displayInterface);
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
      if(this.isKindle) {
        // For e-ink: only use black/white for maximum contrast
        const einkColors = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#ffffff'];
        this.textColor = einkColors[colorIndex] || '#000000';
      } else {
        // Full color palette for regular displays
        const colors = ['#000000', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'];
        this.textColor = colors[colorIndex] || '#0066cc';
      }
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