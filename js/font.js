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
  
  drawText(text, x, y) {
    text = text.toUpperCase();
    const charDimensions = this.display.getCharacterDimensions();
    const maxCharsPerLine = this.display.CHARS_WIDE;
    
    let currentX = x;
    let currentY = y;
    let charCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '\n') {
        // Explicit newline
        currentX = x;
        currentY += charDimensions.height;
        charCount = 0;
        continue;
      }
      
      // Auto-wrap at 40 characters
      if (charCount >= maxCharsPerLine) {
        currentX = x;
        currentY += charDimensions.height;
        charCount = 0;
      }
      
      // Stop if we're past 10 lines
      if (currentY + charDimensions.height > this.display.LOGICAL_HEIGHT - this.display.BORDER_SIZE) {
        break;
      }
      
      this.drawCharacter(currentX, currentY, char);
      currentX += charDimensions.width;
      charCount++;
    }
  }
  
  calculateCursorPosition(text, startX, startY) {
    text = text.toUpperCase();
    const charDimensions = this.display.getCharacterDimensions();
    const maxCharsPerLine = this.display.CHARS_WIDE;
    
    let currentX = startX;
    let currentY = startY;
    let charCount = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '\n') {
        currentX = startX;
        currentY += charDimensions.height;
        charCount = 0;
        continue;
      }
      
      if (charCount >= maxCharsPerLine) {
        currentX = startX;
        currentY += charDimensions.height;
        charCount = 0;
      }
      
      currentX += charDimensions.width;
      charCount++;
    }
    
    return { x: currentX, y: currentY };
  }
  
  drawCursor(text, startX, startY) {
    const cursorPos = this.calculateCursorPosition(text, startX, startY);
    const blockSize = this.display.BLOCK_SIZE;
    const gap = this.display.GAP;
    
    // Draw cursor as individual blocks like text characters (6x8 pattern)
    for (let row = 0; row < 7; row++) { // 7 rows like characters
      for (let col = 0; col < 5; col++) { // 5 columns like characters
        const pixelX = cursorPos.x + col * (blockSize + gap);
        const pixelY = cursorPos.y + row * (blockSize + gap);
        this.display.drawPixelBlock(pixelX, pixelY, blockSize);
      }
    }
  }
}

// Export for use in other modules
window.PixelFont = PixelFont;