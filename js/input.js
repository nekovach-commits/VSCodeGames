// input.js - TRS-80 Model 100 Input Handling Module

class InputHandler {
  constructor(font) {
    this.font = font;
    this.inputText = "";
    this.cursorVisible = true;
    this.cursorTimer = null;
    this.scrollOffset = 0; // How many lines we've scrolled up
    
    // Screen cursor position (independent of text)
    this.cursorRow = 0; // 0-9 (screen row)
    this.cursorCol = 0; // 0-39 (screen column)
    
    // Text buffer as 2D array for easier manipulation
    this.textLines = [];
    for (let i = 0; i < 1000; i++) { // Support lots of lines
      this.textLines[i] = new Array(40).fill(' ');
    }
    
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
      // Add printable character at current cursor screen position
      const char = e.key.toUpperCase();
      if (this.font.FONT_DATA[char]) {
        // Place character in text buffer at current screen position
        const actualRow = this.cursorRow + this.scrollOffset;
        this.textLines[actualRow][this.cursorCol] = char;
        
        // Move cursor right
        this.cursorCol++;
        if (this.cursorCol >= 40) {
          this.cursorCol = 0;
          this.moveCursorDown();
        }
        
        needsRedraw = true;
      }
    } else if (e.key === 'Backspace') {
      // Move cursor left and delete character
      if (this.cursorCol > 0) {
        this.cursorCol--;
      } else if (this.cursorRow > 0 || this.scrollOffset > 0) {
        // Move to end of previous line
        if (this.cursorRow > 0) {
          this.cursorRow--;
        } else {
          this.scrollOffset--;
        }
        this.cursorCol = 39;
      }
      
      // Delete character at cursor position
      const actualRow = this.cursorRow + this.scrollOffset;
      this.textLines[actualRow][this.cursorCol] = ' ';
      needsRedraw = true;
    } else if (e.key === 'Enter') {
      // Move to start of next line
      this.cursorCol = 0;
      this.moveCursorDown();
      needsRedraw = true;
    } else if (e.key === 'ArrowLeft') {
      if (this.cursorCol > 0) {
        this.cursorCol--;
        needsRedraw = true;
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      if (this.cursorCol < 39) {
        this.cursorCol++;
        needsRedraw = true;
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.moveCursorUp();
      needsRedraw = true;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      this.moveCursorDown();
      needsRedraw = true;
      e.preventDefault();
    } else if (e.key === 'Home') {
      this.cursorCol = 0;
      needsRedraw = true;
      e.preventDefault();
    } else if (e.key === 'End') {
      this.cursorCol = 39;
      needsRedraw = true;
      e.preventDefault();
    } else if (e.key === 'Escape') {
      // Clear screen
      for (let i = 0; i < this.textLines.length; i++) {
        this.textLines[i].fill(' ');
      }
      this.cursorRow = 0;
      this.cursorCol = 0;
      this.scrollOffset = 0;
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
    // Set initial text in the text buffer
    const initText = "TRS-80 MODEL 100";
    for (let i = 0; i < initText.length; i++) {
      this.textLines[0][i] = initText[i];
    }
    
    const readyText = "READY";
    for (let i = 0; i < readyText.length; i++) {
      this.textLines[2][i] = readyText[i];
    }
    
    // Position cursor after "READY"
    this.cursorRow = 4;
    this.cursorCol = 0;
    this.scrollOffset = 0;
  }
  
  moveCursorUp() {
    if (this.cursorRow > 0) {
      // Move up on screen
      this.cursorRow--;
    } else if (this.scrollOffset > 0) {
      // At top of screen, scroll up to reveal content above
      this.scrollOffset--;
    }
    // If we're at row 0 and scrollOffset is 0, we're at the absolute top - do nothing
  }
  
  moveCursorDown() {
    if (this.cursorRow < 9) {
      // Move down on screen (lines 0-9)
      this.cursorRow++;
    } else {
      // At bottom of screen, scroll down to reveal content below
      this.scrollOffset++;
    }
  }
  
  moveCursorToLineStart() {
    const lines = this.inputText.split('\n');
    let charCount = 0;
    
    // Find which line the cursor is on and move to its start
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= this.cursorPosition) {
        this.cursorPosition = charCount;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
  }
  
  moveCursorToLineEnd() {
    const lines = this.inputText.split('\n');
    let charCount = 0;
    
    // Find which line the cursor is on and move to its end
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= this.cursorPosition) {
        this.cursorPosition = charCount + lines[i].length;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
  }
  
  getText() {
    // Convert text buffer back to string format for compatibility
    let result = '';
    for (let row = 0; row < this.textLines.length; row++) {
      let line = this.textLines[row].join('').trimEnd();
      if (line.length > 0) {
        result += line + '\n';
      } else if (row < 20) { // Only include empty lines near the top
        result += '\n';
      } else {
        break; // Stop at first empty line beyond initial area
      }
    }
    return result.trimEnd();
  }
  
  setText(text) {
    // Clear existing text
    for (let i = 0; i < this.textLines.length; i++) {
      this.textLines[i].fill(' ');
    }
    
    // Parse text into lines and populate buffer
    const lines = text.split('\n');
    for (let row = 0; row < lines.length && row < this.textLines.length; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length && col < 40; col++) {
        this.textLines[row][col] = line[col];
      }
    }
    
    this.onTextChange && this.onTextChange();
  }
  

  
  updateScrollingForCursor() {
    const totalLines = this.font.getLineCount(this.inputText);
    const maxVisibleLines = this.font.display.LINES_TALL;
    const cursorLine = this.getCursorLineNumber();
    
    if (totalLines <= maxVisibleLines) {
      this.scrollOffset = 0; // No scrolling needed
      return;
    }
    
    // Calculate which lines should be visible to show the cursor
    // scrollOffset represents how many lines from the bottom are hidden
    const maxScrollOffset = totalLines - maxVisibleLines;
    
    // If cursor is in the top part of document, scroll to show it
    if (cursorLine < maxVisibleLines) {
      // Show lines 0 to maxVisibleLines-1
      this.scrollOffset = maxScrollOffset;
    } else {
      // Show lines that include the cursor, preferring bottom alignment
      this.scrollOffset = Math.max(0, totalLines - cursorLine - 1);
    }
    
    console.log(`Scroll update: cursorLine=${cursorLine}, totalLines=${totalLines}, scrollOffset=${this.scrollOffset}, showing lines ${totalLines - maxVisibleLines - this.scrollOffset} to ${totalLines - 1 - this.scrollOffset}`);
  }
  
  getCursorLineNumber() {
    // Find which absolute line number the cursor is on
    const lines = this.inputText.split('\n');
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= this.cursorPosition) {
        return i;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    return lines.length - 1; // Fallback to last line
  }
  
  getCursorVisibleLineNumber() {
    // Find which visible line number (0-9) the cursor appears on
    const cursorLine = this.getCursorLineNumber();
    const totalLines = this.font.getLineCount(this.inputText);
    const maxVisibleLines = this.font.display.LINES_TALL;
    
    if (totalLines <= maxVisibleLines) {
      return cursorLine; // No scrolling, line numbers match
    }
    
    // With scrolling, calculate visible position
    // scrollOffset = 0 means showing bottom lines (lines totalLines-maxVisibleLines to totalLines-1)
    // scrollOffset = max means showing top lines (lines 0 to maxVisibleLines-1)
    const topVisibleLine = Math.max(0, totalLines - maxVisibleLines - this.scrollOffset);
    const visibleLine = cursorLine - topVisibleLine;
    
    // Return visible line number, or -1 if cursor is above visible area, or maxVisibleLines if below
    return Math.max(-1, Math.min(visibleLine, maxVisibleLines));
  }
  
  isCursorVisible() {
    return this.cursorVisible;
  }
  
  getCursorScreenPosition() {
    return { row: this.cursorRow, col: this.cursorCol };
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