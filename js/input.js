// input.js - TRS-80 Model 100 Input Handling Module

class InputHandler {
  constructor(font) {
    this.font = font;
    this.inputText = "";
    this.cursorVisible = true;
    this.cursorTimer = null;
    
    // Bind methods to maintain context
    this.handleKeyInput = this.handleKeyInput.bind(this);
    this.toggleCursor = this.toggleCursor.bind(this);
  }
  
  init() {
    this.setupKeyboardEvents();
    this.startCursorBlink();
    this.setInitialText();
    return this;
  }
  
  setupKeyboardEvents() {
    const container = document.getElementById('retro-container');
    
    // Focus the container so it can receive keyboard events
    container.focus();
    
    // Add keyboard event listeners to the container
    container.addEventListener('keydown', this.handleKeyInput);
    
    // Make sure container stays focused when clicked
    container.addEventListener('click', () => container.focus());
    
    // Keep focus when the page is clicked
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.focus();
      }
    });
  }
  
  handleKeyInput(e) {
    let needsRedraw = false;
    
    if (e.key.length === 1) {
      // Add printable characters
      const char = e.key.toUpperCase();
      if (this.font.FONT_DATA[char] && this.inputText.length < 1000) { // Allow plenty of text
        this.inputText += char;
        needsRedraw = true;
      }
    } else if (e.key === 'Backspace') {
      if (this.inputText.length > 0) {
        this.inputText = this.inputText.slice(0, -1);
        needsRedraw = true;
      }
    } else if (e.key === 'Enter') {
      this.inputText += '\n'; // Add newline
      needsRedraw = true;
    } else if (e.key === 'Tab') {
      this.inputText += '    '; // Add 4 spaces for tab
      needsRedraw = true;
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.inputText = '';
      needsRedraw = true;
    }
    
    if (needsRedraw) {
      this.onTextChange && this.onTextChange();
    }
  }
  
  startCursorBlink() {
    this.cursorTimer = setInterval(this.toggleCursor, 500);
  }
  
  stopCursorBlink() {
    if (this.cursorTimer) {
      clearInterval(this.cursorTimer);
      this.cursorTimer = null;
    }
  }
  
  toggleCursor() {
    this.cursorVisible = !this.cursorVisible;
    this.onCursorBlink && this.onCursorBlink();
  }
  
  setInitialText() {
    this.inputText = "TRS-80 MODEL 100\n\nREADY\n\n";
  }
  
  getText() {
    return this.inputText;
  }
  
  setText(text) {
    this.inputText = text;
    this.onTextChange && this.onTextChange();
  }
  
  isCursorVisible() {
    return this.cursorVisible;
  }
  
  // Event callbacks - set these from the main controller
  onTextChange = null;
  onCursorBlink = null;
  
  // Cleanup method
  destroy() {
    this.stopCursorBlink();
    const container = document.getElementById('retro-container');
    if (container) {
      container.removeEventListener('keydown', this.handleKeyInput);
    }
  }
}

// Export for use in other modules
window.InputHandler = InputHandler;