// SVG-based TRS-80 fallback renderer
// Uses SVG rect elements for pixel-perfect retro rendering, potentially better for Kindle e-ink
(function(){
  const CHAR_W=6, CHAR_H=8, COLS=40, ROWS=20;
  const FONT = window.FONT_DATA || {}; // expects FONT_DATA if advanced font loaded; otherwise limited set
  
  function getGlyph(ch){
    if(FONT[ch]) return FONT[ch];
    const code = ch.charCodeAt(0);
    if(FONT[code]) return FONT[code];
    return [0,0,0,0,0,0,0,0];
  }
  
  class SvgTRS80 {
    constructor(canvas, pixelSize){
      this.canvas = canvas || document.getElementById('retro-canvas');
      this.pixelSize = pixelSize || parseInt(this.canvas.dataset.pixelSize||'2',10);
      this.cols=COLS; this.rows=ROWS;
      this.cursorX=0; this.cursorY=0;
      this.buffer = Array.from({length: ROWS},()=>Array(COLS).fill(' '));
      
      // Create SVG overlay with same dimensions as canvas
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('width', this.canvas.width);
      this.svg.setAttribute('height', this.canvas.height);
      this.svg.style.position = 'absolute';
      this.svg.style.top = this.canvas.offsetTop + 'px';
      this.svg.style.left = this.canvas.offsetLeft + 'px';
      this.svg.style.pointerEvents = 'none'; // Let clicks pass through
      this.svg.style.zIndex = '10';
      
      // Hide canvas and use white background on SVG
      this.canvas.style.display = 'none';
      this.svg.style.backgroundColor = '#ffffff';
      
      // Insert SVG after canvas
      this.canvas.parentNode.insertBefore(this.svg, this.canvas.nextSibling);
      
      this.textColor = '#0066cc'; // Light blue
      this.bgColor = '#ffffff';
      this.cursorVisible = true;
      this.lastBlink = Date.now();
      this.pixelElements = new Map(); // Track created pixels for efficient updates
      
      this.fullRedraw();
      // Initial READY banner
      this.printText('READY\n');
      this.fullRedraw();
      
      window.addEventListener('keydown', e=>this.onKey(e));
      console.log('SvgTRS80 fallback active with SVG rendering');
      
      // Start cursor blink animation
      this.startCursorBlink();
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
      if(this.cursorX>0){ 
        this.cursorX--; 
        this.buffer[this.cursorY][this.cursorX]=' '; 
        this.drawCell(this.cursorX,this.cursorY,' '); 
      }
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
      // Clear all existing pixels
      this.svg.innerHTML = '';
      this.pixelElements.clear();
      
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
      const x0=cx*CHAR_W*pxSize; 
      const y0=cy*CHAR_H*pxSize;
      
      // Remove existing pixels for this cell
      const cellKey = `${cx},${cy}`;
      if(this.pixelElements.has(cellKey)){
        const pixels = this.pixelElements.get(cellKey);
        pixels.forEach(pixel => this.svg.removeChild(pixel));
        this.pixelElements.delete(cellKey);
      }
      
      // Don't draw anything for spaces (keep background white)
      if(ch === ' ') return;
      
      // Create pixel rectangles for this glyph
      const pixels = [];
      for(let row=0; row<CHAR_H; row++){
        const bits = glyph[row] || 0;
        for(let col=0; col<CHAR_W; col++){
          if(bits & (1 << (5-col))){
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x0 + col * pxSize);
            rect.setAttribute('y', y0 + row * pxSize);
            rect.setAttribute('width', pxSize);
            rect.setAttribute('height', pxSize);
            rect.setAttribute('fill', this.textColor);
            rect.setAttribute('shape-rendering', 'crispEdges'); // Ensure pixel-perfect edges
            this.svg.appendChild(rect);
            pixels.push(rect);
          }
        }
      }
      
      if(pixels.length > 0){
        this.pixelElements.set(cellKey, pixels);
      }
    }
    
    drawCursor(){
      // Remove existing cursor
      const cursorPixels = this.pixelElements.get('cursor');
      if(cursorPixels){
        cursorPixels.forEach(pixel => this.svg.removeChild(pixel));
        this.pixelElements.delete('cursor');
      }
      
      if(!this.cursorVisible) return;
      
      // Draw cursor as bottom line of current cell
      const pxSize = this.pixelSize;
      const x0 = this.cursorX * CHAR_W * pxSize;
      const y0 = this.cursorY * CHAR_H * pxSize + (CHAR_H-1) * pxSize;
      
      const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      cursor.setAttribute('x', x0);
      cursor.setAttribute('y', y0);
      cursor.setAttribute('width', CHAR_W * pxSize);
      cursor.setAttribute('height', pxSize);
      cursor.setAttribute('fill', this.textColor);
      cursor.setAttribute('shape-rendering', 'crispEdges');
      this.svg.appendChild(cursor);
      
      this.pixelElements.set('cursor', [cursor]);
    }
    
    startCursorBlink(){
      setInterval(() => {
        this.cursorVisible = !this.cursorVisible;
        this.drawCursor();
      }, 500);
    }
    
    // Clear screen - essential for CLS command
    clearScreen() {
      console.log('SvgTRS80.clearScreen called');
      // Reset all rows to empty strings
      for (let i = 0; i < this.rows; i++) {
        this.buffer[i] = Array(this.cols).fill(' ');
      }
      // Reset cursor position
      this.cursorX = 0;
      this.cursorY = 0;
      console.log('SvgTRS80: Screen cleared, cursor reset to 0,0');
      this.fullRedraw();
    }
    
    // Print text without newlines - convenience method for BASIC commands  
    printText(text) {
      console.log('SvgTRS80.printText called with:', JSON.stringify(text));
      for (let i = 0; i < text.length; i++) {
        console.log('printText: adding char', JSON.stringify(text[i]));
        if(text[i] === '\n'){
          this.newLine();
        } else {
          this.putChar(text[i]);
        }
      }
      console.log('printText: complete, current buffer:', this.buffer);
    }
    
    // Color control methods for BASIC compatibility
    setTextColor(colorIndex) {
      if (colorIndex >= 0 && colorIndex <= 15) {
        // Simple color mapping for SVG - can be expanded
        const colors = [
          '#000000', '#AA0000', '#00AA00', '#AA5500', '#0000AA', '#AA00AA', '#00AAAA', '#AAAAAA',
          '#6F4F25', '#433900', '#9A6759', '#444444', '#6C6C6C', '#9AD284', '#6C5EB5', '#959595'
        ];
        this.textColor = colors[colorIndex] || '#0066cc';
        console.log('SvgTRS80: Text color set to', colorIndex, this.textColor);
      }
    }
    
    // Add character method for BASIC interface compatibility
    addChar(char) {
      console.log('SvgTRS80.addChar called with:', JSON.stringify(char));
      if (char === '\n' || char === 'Enter') {
        this.newLine();
      } else if (char === 'Backspace') {
        this.backspace();
      } else if (char.length === 1) {
        this.putChar(char);
      }
    }
  }
  
  window.SvgTRS80 = SvgTRS80;
})();