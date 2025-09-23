// font.js - TRS-80 Model 100 Pixel Font Module

class PixelFont {
  constructor(display) {
    this.display = display;
    
    // TRS-80 Model 100 Inspired 5x7 Pixel Font
    this.FONT_DATA = {
      'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
      'B': [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
      'C': [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
      'D': [0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
      'E': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
      'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
      'G': [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
      'H': [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
      'I': [0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
      'J': [0b00111,0b00001,0b00001,0b00001,0b10001,0b10001,0b01110],
      'K': [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
      'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
      'M': [0b10001,0b11011,0b10101,0b10001,0b10001,0b10001,0b10001],
      'N': [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
      'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
      'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
      'Q': [0b01110,0b10001,0b10001,0b10101,0b10011,0b01110,0b00001],
      'R': [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
      'S': [0b01110,0b10001,0b10000,0b01110,0b00001,0b10001,0b01110],
      'T': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
      'U': [0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
      'V': [0b10001,0b10001,0b10001,0b10001,0b10001,0b01010,0b00100],
      'W': [0b10001,0b10001,0b10001,0b10001,0b10101,0b11011,0b10001],
      'X': [0b10001,0b01010,0b00100,0b00100,0b00100,0b01010,0b10001],
      'Y': [0b10001,0b01010,0b00100,0b00100,0b00100,0b00100,0b00100],
      'Z': [0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
      '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
      '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
      '2': [0b01110,0b10001,0b00001,0b00010,0b00100,0b01000,0b11111],
      '3': [0b01110,0b10001,0b00001,0b00110,0b00001,0b10001,0b01110],
      '4': [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
      '5': [0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
      '6': [0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],
      '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b10000],
      '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
      '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
      ' ': [0,0,0,0,0,0,0],
      '.': [0,0,0,0,0,0b00100,0b00100],
      ',': [0,0,0,0,0,0b00100,0b01000],
      '!': [0b00100,0b00100,0b00100,0b00100,0b00100,0,0b00100],
      '?': [0b01110,0b10001,0b00010,0b00100,0b00100,0,0b00100],
      ':': [0,0,0b00100,0,0,0b00100,0],
      ';': [0,0,0b00100,0,0,0b00100,0b01000],
      '-': [0,0,0,0b11111,0,0,0],
      '_': [0,0,0,0,0,0,0b11111],
      '(': [0b00010,0b00100,0b01000,0b01000,0b01000,0b00100,0b00010],
      ')': [0b01000,0b00100,0b00010,0b00010,0b00010,0b00100,0b01000],
      '[': [0b01110,0b01000,0b01000,0b01000,0b01000,0b01000,0b01110],
      ']': [0b01110,0b00010,0b00010,0b00010,0b00010,0b00010,0b01110],
      '+': [0,0b00100,0b00100,0b11111,0b00100,0b00100,0],
      '=': [0,0,0b11111,0,0b11111,0,0],
      '*': [0,0b10101,0b01110,0b11111,0b01110,0b10101,0],
      '/': [0,0b00001,0b00010,0b00100,0b01000,0b10000,0],
      '\\': [0,0b10000,0b01000,0b00100,0b00010,0b00001,0]
    };
  }
  
  drawCharacter(x, y, char) {
    const charData = this.FONT_DATA[char] || this.FONT_DATA[' '];
    const blockSize = this.display.BLOCK_SIZE;
    const gap = this.display.GAP;
    
    for (let row = 0; row < 7; row++) { // 7 rows for TRS-80 Model 100
      let rowData = charData[row] || 0;
      for (let col = 0; col < 5; col++) { // 5 columns
        if ((rowData >> (4 - col)) & 1) {
          const pixelX = x + col * (blockSize + gap);
          const pixelY = y + row * (blockSize + gap);
          this.display.drawPixelBlock(pixelX, pixelY, blockSize);
        }
      }
    }
  }
  
  drawText(text, x, y, scrollOffset = 0) {
    console.log('drawText called with:', { textType: typeof text, textLength: text?.length, text, x, y, scrollOffset });
    
    // For backward compatibility, if text is passed as string, use old method
    if (typeof text === 'string') {
      console.log('Using string method for text:', text);
      this.drawTextFromString(text, x, y, scrollOffset);
      return;
    }
    
    // New method: text is actually textLines array passed from input handler
    const textLines = text;
    const charDimensions = this.display.getCharacterDimensions();
    const maxLinesVisible = this.display.LINES_TALL;
    
    console.log('Using array method for textLines:', { linesCount: textLines?.length, maxVisible: maxLinesVisible });
    
    let currentY = y;
    
    // Draw 10 lines starting from scrollOffset
    for (let screenRow = 0; screenRow < maxLinesVisible; screenRow++) {
      const actualRow = screenRow + scrollOffset;
      let currentX = x;
      
      // Draw 40 characters for this line
      for (let col = 0; col < 40; col++) {
        const char = textLines[actualRow] ? textLines[actualRow][col] || ' ' : ' ';
        if (char !== ' ') { // Only draw non-space characters for efficiency
          this.drawCharacter(currentX, currentY, char);
        }
        currentX += charDimensions.width;
      }
      
      currentY += charDimensions.height;
    }
  }
  
  drawTextFromString(text, x, y, scrollOffset = 0) {
    text = text.toUpperCase();
    const charDimensions = this.display.getCharacterDimensions();
    const maxCharsPerLine = this.display.CHARS_WIDE;
    const maxLinesVisible = this.display.LINES_TALL;
    
    // Split text into lines for proper scrolling
    const lines = this.splitTextIntoLines(text, maxCharsPerLine);
    
    // Calculate which lines to display based on scroll offset
    const startLine = Math.max(0, lines.length - maxLinesVisible - scrollOffset);
    const endLine = Math.min(lines.length, startLine + maxLinesVisible);
    
    let currentY = y;
    
    // Draw only the visible lines
    for (let lineIndex = startLine; lineIndex < endLine; lineIndex++) {
      const line = lines[lineIndex];
      let currentX = x;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        this.drawCharacter(currentX, currentY, char);
        currentX += charDimensions.width;
      }
      
      currentY += charDimensions.height;
    }
  }
  
  splitTextIntoLines(text, maxCharsPerLine) {
    const lines = [];
    let currentLine = '';
    let charCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '\n') {
        // Explicit newline - finish current line
        lines.push(currentLine);
        currentLine = '';
        charCount = 0;
      } else {
        // Add character to current line
        currentLine += char;
        charCount++;
        
        // Auto-wrap at max characters per line
        if (charCount >= maxCharsPerLine) {
          lines.push(currentLine);
          currentLine = '';
          charCount = 0;
        }
      }
    }
    
    // Don't forget the last line if it has content
    if (currentLine.length > 0 || text.endsWith('\n')) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  calculateCursorPosition(text, cursorPosition, startX, startY, scrollOffset = 0) {
    text = text.toUpperCase();
    const charDimensions = this.display.getCharacterDimensions();
    const maxCharsPerLine = this.display.CHARS_WIDE;
    const maxLinesVisible = this.display.LINES_TALL;
    
    // Find the line and column where the cursor should be
    let line = 0;
    let column = 0;
    let charCount = 0;
    
    for (let i = 0; i < text.length && charCount < cursorPosition; i++) {
      if (text[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
        if (column >= maxCharsPerLine) {
          line++;
          column = 0;
        }
      }
      charCount++;
    }
    
    // If cursor is at the end and last char wasn't newline, it might be on same line
    if (charCount === cursorPosition && cursorPosition > 0 && text[cursorPosition - 1] !== '\n') {
      // Cursor stays where it is
    }
    
    // Calculate display position based on scrolling
    const totalLines = this.getLineCount(text);
    
    // Calculate which line is at the top of the visible area
    // scrollOffset = 0 means show bottom lines (totalLines - maxLinesVisible to totalLines - 1)
    // scrollOffset = max means show top lines (0 to maxLinesVisible - 1)
    const maxScrollOffset = Math.max(0, totalLines - maxLinesVisible);
    const actualScrollOffset = Math.min(scrollOffset, maxScrollOffset);
    const startLine = Math.max(0, totalLines - maxLinesVisible - actualScrollOffset);
    const displayLine = line - startLine;
    
    // If cursor line is not visible, return null to indicate off-screen
    if (displayLine < 0 || displayLine >= maxLinesVisible) {
      console.log(`Cursor off-screen: line=${line}, startLine=${startLine}, displayLine=${displayLine}, scrollOffset=${scrollOffset}`);
      return null;
    }
    
    const cursorX = startX + column * charDimensions.width;
    const cursorY = startY + displayLine * charDimensions.height;
    
    return { x: cursorX, y: cursorY, char: this.getCharacterAtPosition(text, cursorPosition) };
  }
  
  drawCursor(text, cursorPosition, startX, startY, scrollOffset = 0) {
    const cursorPos = this.calculateCursorPosition(text, cursorPosition, startX, startY, scrollOffset);
    
    // Don't draw cursor if it's off-screen
    if (!cursorPos) return;
    
    const blockSize = this.display.BLOCK_SIZE;
    const gap = this.display.GAP;
    
    // Get the character at cursor position, or space if at end/empty
    const charAtCursor = cursorPos.char || ' ';
    const charData = this.FONT_DATA[charAtCursor] || this.FONT_DATA[' '];
    
    // Draw full 6x8 inverse cursor block to encompass entire character cell
    for (let row = 0; row < 8; row++) { // 8 rows for full character height including spacing
      for (let col = 0; col < 6; col++) { // 6 columns for full character width including spacing
        const pixelX = cursorPos.x + col * (blockSize + gap);
        const pixelY = cursorPos.y + row * (blockSize + gap);
        
        // Check if we're within the 5x7 character data area
        if (row < 7 && col < 5) {
          let rowData = charData[row] || 0;
          if ((rowData >> (4 - col)) & 1) {
            // Character pixel - draw grid color (inverse of text)
            this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.GRID_COLOR);
          } else {
            // Character background pixel - draw text color (inverse of background)
            this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.TEXT_COLOR);
          }
        } else {
          // Spacing area around character - draw text color (inverse of background)
          this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.TEXT_COLOR);
        }
      }
    }
  }
  
  getCharacterAtPosition(text, position) {
    if (position >= 0 && position < text.length) {
      return text[position].toUpperCase();
    }
    return ' '; // Return space for positions at end or beyond
  }
  
  drawCursorAtScreenPosition(row, col, startX, startY, textLines, scrollOffset) {
    const charDimensions = this.display.getCharacterDimensions();
    const cursorX = startX + col * charDimensions.width;
    const cursorY = startY + row * charDimensions.height;
    
    // Get the character at this screen position
    const actualRow = row + scrollOffset;
    const charAtCursor = textLines[actualRow] ? textLines[actualRow][col] || ' ' : ' ';
    
    const blockSize = this.display.BLOCK_SIZE;
    const gap = this.display.GAP;
    const charData = this.FONT_DATA[charAtCursor] || this.FONT_DATA[' '];
    
    // Draw full 6x8 inverse cursor block
    for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
      for (let colIdx = 0; colIdx < 6; colIdx++) {
        const pixelX = cursorX + colIdx * (blockSize + gap);
        const pixelY = cursorY + rowIdx * (blockSize + gap);
        
        // Check if we're within the 5x7 character data area
        if (rowIdx < 7 && colIdx < 5) {
          let rowData = charData[rowIdx] || 0;
          if ((rowData >> (4 - colIdx)) & 1) {
            // Character pixel - draw grid color (inverse of text)
            this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.GRID_COLOR);
          } else {
            // Character background pixel - draw text color (inverse of background)
            this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.TEXT_COLOR);
          }
        } else {
          // Spacing area around character - draw text color (inverse of background)
          this.display.drawPixelBlock(pixelX, pixelY, blockSize, this.display.TEXT_COLOR);
        }
      }
    }
  }
  
  // Helper method to get total number of lines in text
  getLineCount(text) {
    const maxCharsPerLine = this.display.CHARS_WIDE;
    return this.splitTextIntoLines(text.toUpperCase(), maxCharsPerLine).length;
  }
}

// Export for use in other modules
window.PixelFont = PixelFont;