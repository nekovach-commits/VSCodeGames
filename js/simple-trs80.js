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
  this.fullRedraw();
  // Initial READY banner similar to advanced system
  this.printText('READY\n');
      window.addEventListener('keydown', e=>this.onKey(e));
      console.log('SimpleTRS80 fallback active');
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
      // White background for Kindle readability
      this.ctx.fillStyle='#ffffff';
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      for(let y=0;y<this.rows;y++) for(let x=0;x<this.cols;x++) this.drawCell(x,y,this.buffer[y][x]);
    }
    drawCell(cx,cy,ch){
      const glyph=getGlyph(ch);
      const pxSize=this.pixelSize;
      const x0=cx*CHAR_W*pxSize; const y0=cy*CHAR_H*pxSize;
      // wipe cell
      this.ctx.fillStyle='black';
      this.ctx.fillRect(x0,y0,CHAR_W*pxSize,CHAR_H*pxSize);
      this.ctx.fillStyle='lime';
      for(let row=0; row<CHAR_H; row++){
        const bits = glyph[row] || 0;
        for(let col=0; col<CHAR_W; col++){
          if(bits & (1 << (5-col))){
            this.ctx.fillRect(x0+col*pxSize, y0+row*pxSize, pxSize, pxSize);
          }
        }
      }
    }
  }
  window.SimpleTRS80 = SimpleTRS80;
})();