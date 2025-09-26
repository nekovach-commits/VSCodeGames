/**
 * TRS-80 Model 100 Display System
 * Handles all screen rendering and display management
 */

import { TRS80_CONFIG } from './trs80-config.js';
import { drawChar } from './trs80-font.js';

export class TRS80Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Debug: Log initial canvas size
    console.log(`Module init - canvas size: ${this.canvas.width}×${this.canvas.height}`);
    
    // Check if canvas was already sized by inline script
    if (this.canvas.width === 300 && this.canvas.height === 150) {
      console.log('Canvas still at default size, applying module sizing...');
      
      // Detect device and set optimal canvas size
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      console.log(`Module detection: ${screenWidth}×${screenHeight}`);
      
      let pixelSize = 4; // Default desktop
      if (screenWidth === 636 && screenHeight === 848) {
        pixelSize = 2; // Kindle ColorSoft
        console.log('✓ MODULE: Kindle ColorSoft detected - using 2x2 pixel scaling');
      } else if (screenWidth <= 768) {
        pixelSize = 2; // Mobile
        console.log('✓ MODULE: Mobile device detected - using 2x2 pixel scaling');
      } else {
        console.log('✓ MODULE: Desktop detected - using 4x4 pixel scaling');
      }
      
      // Calculate canvas dimensions: 40 chars × 10 rows
      const canvasWidth = (40 * 6 * pixelSize) + 20; // 40 chars, 6px wide, + border
      const canvasHeight = (10 * 8 * pixelSize) + 20; // 10 rows, 8px tall, + border
      
      console.log(`MODULE: Calculated dimensions: ${canvasWidth}×${canvasHeight} with ${pixelSize}x${pixelSize} pixels`);
      
      // Set canvas dimensions explicitly
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      
      console.log(`✓ MODULE: Canvas set to: ${this.canvas.width}×${this.canvas.height}`);
    } else {
      console.log('✓ Canvas already sized by inline script:', this.canvas.width + '×' + this.canvas.height);
    }
    
    // Determine pixel size from canvas dimensions
    const actualWidth = this.canvas.width - 20; // Subtract border
    const charPixelWidth = actualWidth / 40 / 6; // 40 chars, 6 pixels wide
    this.pixelSize = Math.round(charPixelWidth);
    this.charWidth = 6 * this.pixelSize;
    this.charHeight = 8 * this.pixelSize;
    
    // Make canvas focusable for touch devices
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.style.outline = 'none';
    
    console.log(`✓ Using pixel size: ${this.pixelSize}×${this.pixelSize}, char size: ${this.charWidth}×${this.charHeight}`);
    
    // Display state
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
    this.textBuffer = [];
    this.colorBuffer = []; // Store color attributes for each position
    this.cursorVisible = true;
    this.lastBlinkTime = Date.now();
    
    // Graphics mode support
    this.isGraphicsMode = false;
    this.graphicsBuffer = []; // Pixel-level graphics buffer
    this.graphicsWidth = 40 * 6;  // 240 pixels wide (40 chars × 6 pixels)
    this.graphicsHeight = 20 * 8; // 160 pixels tall (20 rows × 8 pixels)
    
    // Current C64 color state
    this.currentTextColor = TRS80_CONFIG.DEFAULT_TEXT_COLOR;      // Light Blue
    this.currentBackgroundColor = TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR; // Black
    this.currentPixelColor = TRS80_CONFIG.DEFAULT_TEXT_COLOR;    // For graphics drawing
    
    // Initialize buffers
    this.initializeBuffer();
    this.initializeGraphicsBuffer();
    
    console.log('TRS-80 Display initialized');
  }
  
  /**
   * Initialize the text buffer with empty spaces and default colors
   */
  initializeBuffer() {
    for (let i = 0; i < TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
      this.colorBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill({
        text: TRS80_CONFIG.DEFAULT_TEXT_COLOR,
        background: TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR
      });
    }
  }
  
  /**
   * Initialize the graphics buffer for pixel-level drawing
   */
  initializeGraphicsBuffer() {
    this.graphicsBuffer = [];
    for (let y = 0; y < this.graphicsHeight; y++) {
      this.graphicsBuffer[y] = new Array(this.graphicsWidth).fill(TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR);
    }
    console.log(`Graphics buffer initialized: ${this.graphicsWidth}×${this.graphicsHeight} pixels`);
  }
  
  /**
   * Add a character to the buffer at cursor position
   * @param {string} char - Character to add
   */
  addChar(char) {
    if (char === '\n') {
      this.cursorRow++;
      this.cursorCol = 0;
      if (this.cursorRow >= TRS80_CONFIG.BUFFER_SIZE) {
        this.cursorRow = TRS80_CONFIG.BUFFER_SIZE - 1;
      }
    } else {
      this.textBuffer[this.cursorRow][this.cursorCol] = char;
      this.colorBuffer[this.cursorRow][this.cursorCol] = {
        text: this.currentTextColor,
        background: this.currentBackgroundColor
      };
      this.cursorCol++;
      if (this.cursorCol >= TRS80_CONFIG.SCREEN_WIDTH) {
        this.cursorCol = 0;
        this.cursorRow++;
        if (this.cursorRow >= TRS80_CONFIG.BUFFER_SIZE) {
          this.cursorRow = TRS80_CONFIG.BUFFER_SIZE - 1;
        }
      }
    }
    this.adjustScrollToShowCursor();
  }
  
  /**
   * Remove character (backspace functionality)
   */
  removeChar() {
    if (this.cursorCol > 0) {
      this.cursorCol--;
      this.textBuffer[this.cursorRow][this.cursorCol] = ' ';
    } else if (this.cursorRow > 0) {
      this.cursorRow--;
      this.cursorCol = TRS80_CONFIG.SCREEN_WIDTH - 1;
      this.textBuffer[this.cursorRow][this.cursorCol] = ' ';
    }
    this.adjustScrollToShowCursor();
  }
  
  /**
   * Move cursor up
   */
  moveCursorUp() {
    if (this.cursorRow > 0) {
      this.cursorRow--;
      this.adjustScrollToShowCursor();
    }
  }
  
  /**
   * Move cursor down
   */
  moveCursorDown() {
    if (this.cursorRow < TRS80_CONFIG.BUFFER_SIZE - 1) {
      this.cursorRow++;
      this.adjustScrollToShowCursor();
    }
  }
  
  /**
   * Move cursor left
   */
  moveCursorLeft() {
    if (this.cursorCol > 0) {
      this.cursorCol--;
    } else if (this.cursorRow > 0) {
      this.cursorRow--;
      this.cursorCol = TRS80_CONFIG.SCREEN_WIDTH - 1;
      this.adjustScrollToShowCursor();
    }
  }
  
  /**
   * Move cursor right
   */
  moveCursorRight() {
    if (this.cursorCol < TRS80_CONFIG.SCREEN_WIDTH - 1) {
      this.cursorCol++;
    } else if (this.cursorRow < TRS80_CONFIG.BUFFER_SIZE - 1) {
      this.cursorRow++;
      this.cursorCol = 0;
      this.adjustScrollToShowCursor();
    }
  }
  
  /**
   * Move cursor to specific position
   * @param {number} col - Column position (0-based)
   * @param {number} row - Row position (0-based) 
   */
  moveCursorTo(col, row) {
    this.cursorCol = Math.max(0, Math.min(col, TRS80_CONFIG.SCREEN_WIDTH - 1));
    this.cursorRow = Math.max(0, Math.min(row, TRS80_CONFIG.BUFFER_SIZE - 1));
    this.adjustScrollToShowCursor();
  }
  
  /**
   * Clear the screen
   */
  clearScreen() {
    for (let i = 0; i < TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
      this.colorBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill({
        text: this.currentTextColor,
        background: this.currentBackgroundColor
      });
    }
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
  }
  
  /**
   * Set current text color (0-15)
   * @param {number} colorIndex - C64 color index (0-15)
   */
  setTextColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentTextColor = colorIndex;
      console.log(`Text color set to: ${TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    }
  }
  
  /**
   * Set current background color (0-15)  
   * @param {number} colorIndex - C64 color index (0-15)
   */
  setBackgroundColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentBackgroundColor = colorIndex;
      console.log(`Background color set to: ${TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    }
  }
  
  /**
   * Fill entire screen with current background color
   */
  fillScreenWithBackgroundColor() {
    for (let row = 0; row < TRS80_CONFIG.BUFFER_SIZE; row++) {
      for (let col = 0; col < TRS80_CONFIG.SCREEN_WIDTH; col++) {
        this.colorBuffer[row][col] = {
          text: this.colorBuffer[row][col].text,
          background: this.currentBackgroundColor
        };
      }
    }
  }
  
  /**
   * Toggle between text and graphics mode
   */
  toggleGraphicsMode() {
    this.isGraphicsMode = !this.isGraphicsMode;
    console.log(`Graphics mode: ${this.isGraphicsMode ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Set pixel color for graphics drawing (0-15)
   * @param {number} colorIndex - C64 color index
   */
  setPixelColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentPixelColor = colorIndex;
      console.log(`Pixel color set to: ${TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    }
  }
  
  /**
   * Draw a pixel at specified coordinates
   * @param {number} x - X coordinate (0 to graphicsWidth-1)
   * @param {number} y - Y coordinate (0 to graphicsHeight-1)
   * @param {number} colorIndex - Optional color (uses current if not specified)
   */
  drawPixel(x, y, colorIndex = null) {
    if (x >= 0 && x < this.graphicsWidth && y >= 0 && y < this.graphicsHeight) {
      const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
      this.graphicsBuffer[y][x] = color;
      console.log(`Pixel drawn at (${x},${y}) with color ${TRS80_CONFIG.C64_COLORS[color].name}`);
    }
  }
  
  /**
   * Draw a line between two points (simple Bresenham algorithm)
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate  
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {number} colorIndex - Optional color
   */
  drawLine(x1, y1, x2, y2, colorIndex = null) {
    const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    
    while (true) {
      this.drawPixel(x, y, color);
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    
    console.log(`Line drawn from (${x1},${y1}) to (${x2},${y2}) with color ${TRS80_CONFIG.C64_COLORS[color].name}`);
  }
  
  /**
   * Clear graphics buffer
   */
  clearGraphics() {
    for (let y = 0; y < this.graphicsHeight; y++) {
      this.graphicsBuffer[y].fill(this.currentBackgroundColor);
    }
    console.log('Graphics buffer cleared');
  }
  
  /**
   * Adjust scroll to keep cursor visible
   */
  adjustScrollToShowCursor() {
    // If cursor is above visible area, scroll up
    if (this.cursorRow < this.scrollOffset) {
      this.scrollOffset = this.cursorRow;
    }
    // If cursor is below visible area, scroll down
    else if (this.cursorRow >= this.scrollOffset + TRS80_CONFIG.SCREEN_HEIGHT) {
      this.scrollOffset = this.cursorRow - TRS80_CONFIG.SCREEN_HEIGHT + 1;
    }
    
    // Keep scroll within bounds
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, TRS80_CONFIG.BUFFER_SIZE - TRS80_CONFIG.SCREEN_HEIGHT));
  }
  
  /**
   * Render the complete TRS-80 display
   */
  render() {
    // Use dynamic sizing instead of config constants
    const BORDER_SIZE = 10;
    
    // Handle cursor blinking
    const currentTime = Date.now();
    if (currentTime - this.lastBlinkTime > TRS80_CONFIG.CURSOR_BLINK_RATE) {
      this.cursorVisible = !this.cursorVisible;
      this.lastBlinkTime = currentTime;
    }
    
    // Clear canvas with background color (white if transparent)
    if (TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR === -1) {
      // Transparent background - use white
      this.ctx.fillStyle = '#ffffff';
    } else {
      const bgColor = TRS80_CONFIG.C64_COLORS[TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR];
      this.ctx.fillStyle = bgColor.hex;
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw border frame
    const borderColor = TRS80_CONFIG.C64_COLORS[1]; // White border
    this.ctx.fillStyle = borderColor.hex;
    this.ctx.fillRect(0, 0, this.canvas.width, BORDER_SIZE); // Top
    this.ctx.fillRect(0, this.canvas.height - BORDER_SIZE, this.canvas.width, BORDER_SIZE); // Bottom  
    this.ctx.fillRect(0, 0, BORDER_SIZE, this.canvas.height); // Left
    this.ctx.fillRect(this.canvas.width - BORDER_SIZE, 0, BORDER_SIZE, this.canvas.height); // Right
    
    // Render based on current mode
    if (this.isGraphicsMode) {
      this.renderGraphics(BORDER_SIZE);
    } else {
      this.renderText(BORDER_SIZE);
    }
    
    // Always render cursor in text mode
    if (!this.isGraphicsMode) {
      this.renderCursor(BORDER_SIZE);
    }
  }
  
  /**
   * Render text mode display
   */
  renderText(BORDER_SIZE) {
    
    // Render visible text from buffer with colors
    for (let screenRow = 0; screenRow < TRS80_CONFIG.SCREEN_HEIGHT; screenRow++) {
      const bufferRow = screenRow + this.scrollOffset;
      if (bufferRow >= 0 && bufferRow < TRS80_CONFIG.BUFFER_SIZE) {
        for (let col = 0; col < TRS80_CONFIG.SCREEN_WIDTH; col++) {
          const char = this.textBuffer[bufferRow][col];
          const colors = this.colorBuffer[bufferRow][col];
          
          const x = BORDER_SIZE + col * this.charWidth;
          const y = BORDER_SIZE + screenRow * this.charHeight;
          
          // Draw background color if not transparent and not default
          if (colors && colors.background !== -1 && colors.background !== TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR) {
            const bgColor = TRS80_CONFIG.C64_COLORS[colors.background];
            if (bgColor) {
              this.ctx.fillStyle = bgColor.hex;
              this.ctx.fillRect(x, y, this.charWidth, this.charHeight);
            }
          }
          
          // Draw character with foreground color
          if (char && char !== ' ') {
            const textColor = colors ? TRS80_CONFIG.C64_COLORS[colors.text] : TRS80_CONFIG.C64_COLORS[TRS80_CONFIG.DEFAULT_TEXT_COLOR];
            if (textColor) {
              drawChar(this.ctx, char, x, y, this.pixelSize, textColor.hex);
            }
          }
        }
      }
    }
  }
  
  /**
   * Render graphics mode display
   */
  renderGraphics(BORDER_SIZE) {
    // Render each pixel from graphics buffer
    for (let y = 0; y < this.graphicsHeight; y++) {
      for (let x = 0; x < this.graphicsWidth; x++) {
        const colorIndex = this.graphicsBuffer[y][x];
        const color = TRS80_CONFIG.C64_COLORS[colorIndex];
        
        if (color && colorIndex !== TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR) {
          this.ctx.fillStyle = color.hex;
          const canvasX = BORDER_SIZE + x * this.pixelSize;
          const canvasY = BORDER_SIZE + y * this.pixelSize;
          this.ctx.fillRect(canvasX, canvasY, this.pixelSize, this.pixelSize);
        }
      }
    }
  }
  
  /**
   * Render cursor in text mode
   */
  renderCursor(BORDER_SIZE) {
    const screenCursorRow = this.cursorRow - this.scrollOffset;
    if (screenCursorRow >= 0 && screenCursorRow < TRS80_CONFIG.SCREEN_HEIGHT && this.cursorVisible) {
      const cursorX = BORDER_SIZE + this.cursorCol * this.charWidth;
      const cursorY = BORDER_SIZE + screenCursorRow * this.charHeight;
      
      // Draw solid cursor block with current text color
      const cursorColor = TRS80_CONFIG.C64_COLORS[this.currentTextColor];
      this.ctx.fillStyle = cursorColor.hex;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          const pixelX = cursorX + c * this.pixelSize;
          const pixelY = cursorY + r * this.pixelSize;
          this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
        }
      }
      
      // Invert character if present at cursor position
      const charAtCursor = this.textBuffer[this.cursorRow]?.[this.cursorCol];
      if (charAtCursor && charAtCursor !== ' ') {
        const bgColor = TRS80_CONFIG.C64_COLORS[this.currentBackgroundColor];
        drawChar(this.ctx, charAtCursor, cursorX, cursorY, this.pixelSize, bgColor.hex);
      }
    }
  }
}