// SimpleTRS80 fallback implementation
// Minimal text-only renderer using 6x8 cells directly on the canvas
(function(){
  const CHAR_W=6, CHAR_H=8, COLS=40, ROWS=20;
  const FONT = window.FONT_DATA || {}; // expects FONT_DATA if advanced font loaded; otherwise limited set
  function getGlyph(ch){
    if(FONT[ch]) return FONT[ch];
    const code = ch.charCodeAt(0);
    if(FONT[code]) return FONT[code];
    return [0,0,0,0,0,0,0,0];
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
  
  // Optimize colors for e-ink displays - high contrast
  this.isKindle = /Kindle|Silk|KF|ColorSoft/i.test(navigator.userAgent);
  if(this.isKindle) {
    this.textColor = '#000000'; // Pure black for e-ink
    this.bgColor = '#ffffff';   // Pure white background
    this.cellBg = '#ffffff';    // Keep cells white
    console.log('Kindle detected - using high contrast colors');
  } else {
    this.textColor = '#0066cc'; // Light blue for regular displays
    this.bgColor = '#ffffff';
    this.cellBg = '#ffffff';
  }
  this.cursorVisible = true;
  this.lastBlink = Date.now();
  this.fullRedraw();
  // Initial READY banner similar to advanced system
  this.printText('READY\n');
  this.fullRedraw();
      window.addEventListener('keydown', e=>this.onKey(e));
      this.setupInputHandling();
      
      // Device and canvas info for troubleshooting
      console.log('SimpleTRS80 active:', {
        isKindle: this.isKindle,
        canvasSize: this.canvas.width + 'x' + this.canvas.height,
        pixelSize: this.pixelSize,
        colors: { text: this.textColor, bg: this.bgColor }
      });
      
      console.log('SimpleTRS80 canvas renderer initialized for', this.isKindle ? 'Kindle e-ink' : 'standard display');
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
      if(this.cursorX>=this.cols){ this.newLine(); }
    }
    backspace(){
      if(this.cursorX>0){ this.cursorX--; this.buffer[this.cursorY][this.cursorX]=' '; this.drawCell(this.cursorX,this.cursorY,' '); }
    }
    newLine(){
      this.cursorX=0; this.cursorY++;
      if(this.cursorY>=this.rows){
        this.buffer.shift();
        this.buffer.push(Array(this.cols).fill(' '));
        this.cursorY=this.rows-1;
        this.fullRedraw();
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
      
      // Skip drawing for spaces
      if(ch === ' ') return;
      
      // Draw character pixels with high contrast
      this.ctx.fillStyle=this.textColor;
      for(let row=0; row<CHAR_H; row++){
        const bits = glyph[row] || 0;
        for(let col=0; col<CHAR_W; col++){
          if(bits & (1 << (5-col))){
            // Use integer coordinates for crisp pixels on e-ink
            const px = Math.floor(x0+col*pxSize);
            const py = Math.floor(y0+row*pxSize);
            this.ctx.fillRect(px, py, pxSize, pxSize);
          }
        }
      }
      
      // simple blinking cursor if at this cell
      if(this.cursorX===cx && this.cursorY===cy){
        const now=Date.now();
        if(now - this.lastBlink > 500){ this.cursorVisible=!this.cursorVisible; this.lastBlink=now; }
        if(this.cursorVisible){
          this.ctx.fillStyle=this.textColor;
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
          console.log('Kindle input:', newValue);
          
          // Find what was added (handle typing and pasting)
          if (newValue.length > inputBuffer.length) {
            const addedText = newValue.slice(inputBuffer.length);
            for (let char of addedText) {
              console.log('Processing char:', char);
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
            this.newLine();
            
            // Process BASIC command if SharedBasicProcessor is available
            if (window.SharedBasicProcessor && currentLine.trim()) {
              const displayInterface = {
                addText: (text) => this.printText(text),
                setTextColor: (colorIndex) => this.setTextColor(colorIndex),
                clearScreen: () => this.clearScreen()
              };
              const program = new Map(); // Simple program storage
              window.SharedBasicProcessor.processLine(currentLine.trim(), program, displayInterface);
            }
            
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
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
          this.newLine();
        } else {
          this.putChar(text[i]);
        }
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