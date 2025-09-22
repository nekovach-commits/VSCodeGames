// main.js - TRS-80 Model 100 Main Application Controller

class TRS80System {
  constructor() {
    this.display = null;
    this.font = null;
    this.input = null;
  }
  
  init() {
    // Initialize modules in dependency order
    this.display = new Display().init();
    this.font = new PixelFont(this.display);
    this.input = new InputHandler(this.font).init();
    
    // Set up event callbacks
    this.input.onTextChange = () => this.render();
    this.input.onCursorBlink = () => this.render();
    
    // Set up window event listeners
    this.setupWindowEvents();
    
    // Initial render
    this.render();
    
    console.log('TRS-80 Model 100 System Initialized');
  }
  
  setupWindowEvents() {
    window.addEventListener('resize', () => {
      this.display.setupCanvas();
      this.display.updateResolutionInfo();
      this.render();
    });
    
    // Initial resolution info update
    this.display.updateResolutionInfo();
  }
  
  render() {
    // Clear screen and draw border
    this.display.clearScreen();
    this.display.drawBorder();
    
    // Set text color and get start position
    this.display.setTextColor();
    const startPos = this.display.getTextStartPosition();
    
    // Draw text with scroll offset (pass text buffer directly)
    this.font.drawText(this.input.textLines, startPos.x, startPos.y, this.input.scrollOffset);
    
    // Draw cursor if visible
    if (this.input.isCursorVisible()) {
      this.font.drawCursorAtScreenPosition(this.input.cursorRow, this.input.cursorCol, startPos.x, startPos.y, this.input.textLines, this.input.scrollOffset);
    }
  }
  
  // Public API methods for future expansion
  setText(text) {
    this.input.setText(text);
  }
  
  getText() {
    return this.input.getText();
  }
  
  clearScreen() {
    this.input.setText('');
  }
  
  // Utility methods for future BASIC interpreter
  print(text) {
    const currentText = this.input.getText();
    this.input.setText(currentText + text);
  }
  
  println(text) {
    this.print(text + '\n');
  }
  
  // System info
  getSystemInfo() {
    return {
      display: {
        width: this.display.LOGICAL_WIDTH,
        height: this.display.LOGICAL_HEIGHT,
        charsWide: this.display.CHARS_WIDE,
        linesTall: this.display.LINES_TALL,
        blockSize: this.display.BLOCK_SIZE
      },
      version: '1.0'
    };
  }
}

// Global system instance
let trs80System = null;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  trs80System = new TRS80System();
  trs80System.init();
  
  // Make system globally accessible for debugging/expansion
  window.TRS80 = trs80System;
});