/**
 * TRS-80 Model 100 Display System
 * Handles all screen rendering and display management
 */

// Use global references instead of imports
// Dependencies: window.TRS80_CONFIG, window.drawChar

window.TRS80Display = class TRS80Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Debug controls and render scheduling
  this.debug = true; // set to true to enable verbose logs
    this.renderScheduled = false; // coalesce renders via requestAnimationFrame
    
    // Debug: Log initial canvas size
    if (this.debug) console.log(`Module init - canvas size: ${this.canvas.width}×${this.canvas.height}`);
    
    // Assume canvas pre-sized by boot loader for full 40x20 grid (no legacy 10-row logic)
    // Derive pixel size directly from width/height ratios
    const cols = window.TRS80_CONFIG.SCREEN_WIDTH;      // 40
    const rows = window.TRS80_CONFIG.SCREEN_HEIGHT;     // 20
    // Estimate pixel size ignoring border (border drawing will not consume logical space now)
    this.pixelSize = Math.floor(this.canvas.width / (cols * 6));
    if (this.pixelSize < 1) this.pixelSize = 1;
    this.charWidth = 6 * this.pixelSize;
    this.charHeight = 8 * this.pixelSize;
    if (this.debug) {
      console.log('[DEBUG] pixelSize:', this.pixelSize, 'charWidth:', this.charWidth, 'charHeight:', this.charHeight);
    }
    
    // Make canvas focusable for touch devices
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.style.outline = 'none';
    
  if (this.debug) console.log(`✓ Using pixel size: ${this.pixelSize}×${this.pixelSize}, char size: ${this.charWidth}×${this.charHeight}`);
    
    // Display state
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
    this.textBuffer = [];
    this.colorBuffer = []; // Store color attributes for each position
    this.cursorVisible = true;
    this.lastBlinkTime = Date.now();
    
    // Graphics mode support
  // this.isGraphicsMode = false; // Always show graphics under text
    this.graphicsBuffer = []; // Pixel-level graphics buffer
    this.graphicsWidth = 40 * 6;  // 240 pixels wide (40 chars × 6 pixels)
    this.graphicsHeight = 20 * 8; // 160 pixels tall (20 rows × 8 pixels)
    
    // Current C64 color state
    this.currentTextColor = window.TRS80_CONFIG.DEFAULT_TEXT_COLOR;      // Light Blue
    this.currentBackgroundColor = window.TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR; // Black
    this.currentPixelColor = window.TRS80_CONFIG.DEFAULT_TEXT_COLOR;    // For graphics drawing
    
    // Initialize buffers
    this.initializeBuffer();
    this.initializeGraphicsBuffer();
    
  if (this.debug) console.log('TRS-80 Display initialized');
  }
  
  /**
   * Initialize the text buffer with empty spaces and default colors
   */
  initializeBuffer() {
    for (let i = 0; i < window.TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(window.TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
      this.colorBuffer[i] = new Array(window.TRS80_CONFIG.SCREEN_WIDTH).fill({
        text: 0, // Black
        background: 15 // White
      });
    }
  }
  
  /**
   * Initialize the graphics buffer for pixel-level drawing
   */
  initializeGraphicsBuffer() {
    this.graphicsBuffer = [];
    // Fill with white (index 15) for graphics rendering
    const whiteColor = 15;
    for (let y = 0; y < this.graphicsHeight; y++) {
      this.graphicsBuffer[y] = new Array(this.graphicsWidth).fill(whiteColor);
    }
    if (this.debug) {
      console.log(`Graphics buffer initialized: ${this.graphicsWidth}×${this.graphicsHeight} pixels (white)`);
      console.log('First row of graphicsBuffer:', this.graphicsBuffer[0].slice(0, 20));
    }
  }
  
  /**
   * Schedule a render on the next animation frame (coalesces many updates)
   */
  requestRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    window.requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  }
  
  /**
   * Add a character to the buffer at cursor position
   * @param {string} char - Character to add
   */
  addChar(char) {
    if (this.debug) {
      console.log('TRS80Display.addChar called with:', JSON.stringify(char));
      console.log('Current cursor position: row', this.cursorRow, 'col', this.cursorCol);
    }
    
    if (char === '\n') {
  if (this.debug) console.log('Processing newline');
      this.cursorRow++;
      this.cursorCol = 0;
      if (this.cursorRow >= window.TRS80_CONFIG.BUFFER_SIZE) {
        this.cursorRow = window.TRS80_CONFIG.BUFFER_SIZE - 1;
      }
    } else {
  if (this.debug) console.log('Adding character to textBuffer at', this.cursorRow, this.cursorCol);
      this.textBuffer[this.cursorRow][this.cursorCol] = char;
      this.colorBuffer[this.cursorRow][this.cursorCol] = {
        text: this.currentTextColor,
        background: this.currentBackgroundColor
      };
      this.cursorCol++;
      if (this.cursorCol >= window.TRS80_CONFIG.SCREEN_WIDTH) {
        this.cursorCol = 0;
        this.cursorRow++;
        if (this.cursorRow >= window.TRS80_CONFIG.BUFFER_SIZE) {
          this.cursorRow = window.TRS80_CONFIG.BUFFER_SIZE - 1;
        }
      }
    }
    if (this.debug) {
      console.log('New cursor position: row', this.cursorRow, 'col', this.cursorCol);
      console.log('Buffer content at current row:', JSON.stringify(this.textBuffer[this.cursorRow].join('')));
    }
    
    this.adjustScrollToShowCursor();
    
    // Coalesce renders for performance
    this.requestRender();
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
      this.cursorCol = window.TRS80_CONFIG.SCREEN_WIDTH - 1;
      this.textBuffer[this.cursorRow][this.cursorCol] = ' ';
    }
    // Only call adjustScrollToShowCursor once
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
    if (this.cursorRow < window.TRS80_CONFIG.BUFFER_SIZE - 1) {
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
      this.cursorCol = window.TRS80_CONFIG.SCREEN_WIDTH - 1;
      this.adjustScrollToShowCursor();
    }
  }
  
  /**
   * Move cursor right
   */
  moveCursorRight() {
    if (this.cursorCol < window.TRS80_CONFIG.SCREEN_WIDTH - 1) {
      this.cursorCol++;
    } else if (this.cursorRow < window.TRS80_CONFIG.BUFFER_SIZE - 1) {
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
    this.cursorCol = Math.max(0, Math.min(col, window.TRS80_CONFIG.SCREEN_WIDTH - 1));
    this.cursorRow = Math.max(0, Math.min(row, window.TRS80_CONFIG.BUFFER_SIZE - 1));
    this.adjustScrollToShowCursor();
  }
  
  /**
   * Clear the screen
   */
  clearScreen() {
    for (let i = 0; i < window.TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(window.TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
      this.colorBuffer[i] = new Array(window.TRS80_CONFIG.SCREEN_WIDTH).fill({
        text: this.currentTextColor,
        background: this.currentBackgroundColor
      });
    }
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
    this.requestRender();
  }
  
  /**
   * Set current text color (0-15)
   * @param {number} colorIndex - C64 color index (0-15)
   */
  setTextColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentTextColor = colorIndex;
      // Keep graphics pixel color in sync with text foreground for simplicity
      this.currentPixelColor = colorIndex;
      if (this.debug) console.log(`Text color set to: ${window.TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    } else {
      // Default to black if invalid
      this.currentTextColor = 0;
      this.currentPixelColor = 0;
    }
  }
  
  /**
   * Set current background color (0-15)  
   * @param {number} colorIndex - C64 color index (0-15)
   */
  setBackgroundColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentBackgroundColor = colorIndex;
      if (this.debug) console.log(`Background color set to: ${window.TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    } else {
      // Default to white if invalid
      this.currentBackgroundColor = 15;
    }
  }
  
  /**
   * Fill entire screen with current background color
   */
  fillScreenWithBackgroundColor() {
    for (let row = 0; row < window.TRS80_CONFIG.BUFFER_SIZE; row++) {
      for (let col = 0; col < window.TRS80_CONFIG.SCREEN_WIDTH; col++) {
        this.colorBuffer[row][col] = {
          text: 0, // Black
          background: 15 // White
        };
      }
    }
  }
  
  /**
   * Toggle between text and graphics mode
   */
  toggleGraphicsMode() {
    // No-op: always show graphics under text
    if (this.debug) console.log('Graphics mode toggle called (no-op, always on)');
  }
  
  /**
   * Set pixel color for graphics drawing (0-15)
   * @param {number} colorIndex - C64 color index
   */
  setPixelColor(colorIndex) {
    if (colorIndex >= 0 && colorIndex <= 15) {
      this.currentPixelColor = colorIndex;
      if (this.debug) console.log(`Pixel color set to: ${window.TRS80_CONFIG.C64_COLORS[colorIndex].name}`);
    }
  }
  
  /**
   * Draw a pixel at specified coordinates
   * @param {number} x - X coordinate (0 to graphicsWidth-1)
   * @param {number} y - Y coordinate (0 to graphicsHeight-1)
   * @param {number} colorIndex - Optional color (uses current if not specified)
   */
  drawPixel(x, y, colorIndex = null) {
    if (this.debug) {
      console.log(`[drawPixel] CALLED with (${x},${y}), colorIndex: ${colorIndex}`);
    }
    // Ensure graphics layer is active
    // this.isGraphicsMode = true; // Always show graphics
    if (x >= 0 && x < this.graphicsWidth && y >= 0 && y < this.graphicsHeight) {
      const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
      this.graphicsBuffer[y][x] = color;
      if (this.debug) {
        console.log(`[drawPixel] Pixel drawn at (${x},${y}) with color index ${color} (${window.TRS80_CONFIG.C64_COLORS[color]?.name})`);
      }
      this.requestRender();
    } else if (this.debug) {
      console.warn(`[drawPixel] Out of bounds: (${x},${y})`);
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
    if (this.debug) {
      console.log(`[drawLine] CALLED with (${x1},${y1}) to (${x2},${y2}), colorIndex: ${colorIndex}`);
    }
    // Ensure graphics layer is active
    // this.isGraphicsMode = true; // Always show graphics
    const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;
    let pixelCount = 0;
    let safety = 0;
    const MAX_PIXELS = 10000;
    while (true) {
      // Break if out of bounds to prevent infinite loop
      if (x < 0 || x >= this.graphicsWidth || y < 0 || y >= this.graphicsHeight) {
        if (this.debug) console.warn('[drawLine] Out of bounds, breaking', {x, y, x1, y1, x2, y2, pixelCount});
        break;
      }
      this.drawPixel(x, y, color);
      pixelCount++;
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
      safety++;
      if (safety > MAX_PIXELS) {
        if (this.debug) console.error('[drawLine] Safety break: too many pixels', {x1, y1, x2, y2, pixelCount});
        break;
      }
    }
    if (this.debug) {
      console.log(`Line drawn from (${x1},${y1}) to (${x2},${y2}) with color index ${color} (${window.TRS80_CONFIG.C64_COLORS[color]?.name}), pixels: ${pixelCount}`);
    }
    this.requestRender();
  }
  
  /**
   * Clear graphics buffer
   */
  clearGraphics() {
    // Always clear to white (index 15)
    for (let y = 0; y < this.graphicsHeight; y++) {
      this.graphicsBuffer[y].fill(15);
    }
    if (this.debug) console.log('Graphics buffer cleared to white');
    this.requestRender();
  }

  /**
   * Draw rectangle (outline or filled)
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {boolean} filled
   * @param {number|null} colorIndex
   */
  drawRect(x1, y1, x2, y2, filled = false, colorIndex = null) {
  // this.isGraphicsMode = true; // Always show graphics
    const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(this.graphicsWidth - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(this.graphicsHeight - 1, Math.max(y1, y2));
    if (filled) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          this.graphicsBuffer[y][x] = color;
        }
      }
    } else {
      for (let x = minX; x <= maxX; x++) {
        this.graphicsBuffer[minY][x] = color;
        this.graphicsBuffer[maxY][x] = color;
      }
      for (let y = minY; y <= maxY; y++) {
        this.graphicsBuffer[y][minX] = color;
        this.graphicsBuffer[y][maxX] = color;
      }
    }
    if (this.debug) console.log(`Rectangle ${filled ? 'filled' : 'outline'} from (${minX},${minY}) to (${maxX},${maxY})`);
    this.requestRender();
  }

  /**
   * Draw circle (outline or filled) using midpoint algorithm
   * @param {number} cx
   * @param {number} cy
   * @param {number} r
   * @param {boolean} filled
   * @param {number|null} colorIndex
   */
  drawCircle(cx, cy, r, filled = false, colorIndex = null) {
  // this.isGraphicsMode = true; // Always show graphics
    const color = colorIndex !== null ? colorIndex : this.currentPixelColor;
    let x = r;
    let y = 0;
    let err = 0;
    const plot = (px, py) => {
      if (px >= 0 && px < this.graphicsWidth && py >= 0 && py < this.graphicsHeight) {
        this.graphicsBuffer[py][px] = color;
      }
    };
    const hline = (x1, x2, yy) => {
      const min = Math.max(0, Math.min(x1, x2));
      const max = Math.min(this.graphicsWidth - 1, Math.max(x1, x2));
      if (yy < 0 || yy >= this.graphicsHeight) return;
      for (let xx = min; xx <= max; xx++) this.graphicsBuffer[yy][xx] = color;
    };
    while (x >= y) {
      if (filled) {
        hline(cx - x, cx + x, cy + y);
        hline(cx - y, cx + y, cy + x);
        hline(cx - x, cx + x, cy - y);
        hline(cx - y, cx + y, cy - x);
      } else {
        plot(cx + x, cy + y); plot(cx + y, cy + x);
        plot(cx - y, cy + x); plot(cx - x, cy + y);
        plot(cx - x, cy - y); plot(cx - y, cy - x);
        plot(cx + y, cy - x); plot(cx + x, cy - y);
      }
      y += 1;
      if (err <= 0) {
        err += 2 * y + 1;
      }
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }
    if (this.debug) console.log(`Circle ${filled ? 'filled' : 'outline'} at (${cx},${cy}) r=${r}`);
    this.requestRender();
  }

  /**
   * Flood fill starting at (x,y) replacing target color with current
   */
  floodFill(x, y, colorIndex = null) {
  // this.isGraphicsMode = true; // Always show graphics
    const newColor = colorIndex !== null ? colorIndex : this.currentPixelColor;
    if (x < 0 || y < 0 || x >= this.graphicsWidth || y >= this.graphicsHeight) return;
    const target = this.graphicsBuffer[y][x];
    if (target === newColor) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= this.graphicsWidth || cy >= this.graphicsHeight) continue;
      if (this.graphicsBuffer[cy][cx] !== target) continue;
      this.graphicsBuffer[cy][cx] = newColor;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    if (this.debug) console.log(`Flood fill from (${x},${y})`);
    this.requestRender();
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
    else if (this.cursorRow >= this.scrollOffset + window.TRS80_CONFIG.SCREEN_HEIGHT) {
      this.scrollOffset = this.cursorRow - window.TRS80_CONFIG.SCREEN_HEIGHT + 1;
    }
    
    // Keep scroll within bounds
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, window.TRS80_CONFIG.BUFFER_SIZE - window.TRS80_CONFIG.SCREEN_HEIGHT));
  }
  
  /**
   * Render the complete TRS-80 display
   */
  render() {
    // Use dynamic sizing instead of config constants
    const BORDER_SIZE = 10;
    
    // Handle cursor blinking
    const currentTime = Date.now();
    if (currentTime - this.lastBlinkTime > window.TRS80_CONFIG.CURSOR_BLINK_RATE) {
      this.cursorVisible = !this.cursorVisible;
      this.lastBlinkTime = currentTime;
    }
    
    // Clear canvas with background color (white if transparent)
    // Always use white for background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
  // Draw border frame
  const borderColor = window.TRS80_CONFIG.C64_COLORS[window.TRS80_CONFIG.BORDER_COLOR_INDEX]; // Grey border
  this.ctx.fillStyle = borderColor.hex;
  this.ctx.fillRect(0, 0, this.canvas.width, BORDER_SIZE); // Top
  this.ctx.fillRect(0, this.canvas.height - BORDER_SIZE, this.canvas.width, BORDER_SIZE); // Bottom  
  this.ctx.fillRect(0, 0, BORDER_SIZE, this.canvas.height); // Left
  this.ctx.fillRect(this.canvas.width - BORDER_SIZE, 0, BORDER_SIZE, this.canvas.height); // Right
    
    // Render graphics layer first (if enabled), then always render text and cursor on top
    this.renderGraphics(BORDER_SIZE);
    this.renderText(BORDER_SIZE);
    this.renderCursor(BORDER_SIZE);
  }
  
  /**
   * Render text mode display
   */
  renderText(BORDER_SIZE) {
    
    // Render visible text from buffer with colors
    for (let screenRow = 0; screenRow < window.TRS80_CONFIG.SCREEN_HEIGHT; screenRow++) {
      const bufferRow = screenRow + this.scrollOffset;
      if (bufferRow >= 0 && bufferRow < window.TRS80_CONFIG.BUFFER_SIZE) {
        for (let col = 0; col < window.TRS80_CONFIG.SCREEN_WIDTH; col++) {
          const char = this.textBuffer[bufferRow][col];
          const colors = this.colorBuffer[bufferRow][col];
          
          const x = BORDER_SIZE + col * this.charWidth;
          const y = BORDER_SIZE + screenRow * this.charHeight;
          
          // Draw background color if not transparent and not default
          if (colors && colors.background !== -1 && colors.background !== window.TRS80_CONFIG.DEFAULT_BACKGROUND_COLOR) {
            const bgColor = window.TRS80_CONFIG.C64_COLORS[colors.background];
            if (bgColor) {
              this.ctx.fillStyle = bgColor.hex;
              this.ctx.fillRect(x, y, this.charWidth, this.charHeight);
            }
          }
          
          // Draw character with foreground color
          if (char && char !== ' ') {
            const textColor = colors ? window.TRS80_CONFIG.C64_COLORS[colors.text] : window.TRS80_CONFIG.C64_COLORS[window.TRS80_CONFIG.DEFAULT_TEXT_COLOR];
            if (textColor) {
              window.drawChar(this.ctx, char, x, y, this.pixelSize, textColor.hex);
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
    if (this.debug) {
      console.log('[DEBUG] renderGraphics called');
      console.log('Canvas size:', this.canvas.width, this.canvas.height);
      console.log('Graphics buffer size:', this.graphicsWidth, this.graphicsHeight);
      console.log('pixelSize:', this.pixelSize, 'charWidth:', this.charWidth, 'charHeight:', this.charHeight);
    }
    // Always render every pixel in the graphics buffer, including background color
    for (let y = 0; y < this.graphicsHeight; y++) {
      for (let x = 0; x < this.graphicsWidth; x++) {
        const colorIndex = this.graphicsBuffer[y][x];
        const color = window.TRS80_CONFIG.C64_COLORS[colorIndex];
        // Always draw the pixel, even if it's the background color (white)
        if (color) {
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
    if (screenCursorRow >= 0 && screenCursorRow < window.TRS80_CONFIG.SCREEN_HEIGHT && this.cursorVisible) {
      const cursorX = BORDER_SIZE + this.cursorCol * this.charWidth;
      const cursorY = BORDER_SIZE + screenCursorRow * this.charHeight;
      
      // Draw simple blinking cursor block with current text color
      const cursorColor = window.TRS80_CONFIG.C64_COLORS[this.currentTextColor];
      this.ctx.fillStyle = cursorColor.hex;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          const pixelX = cursorX + c * this.pixelSize;
          const pixelY = cursorY + r * this.pixelSize;
          this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
        }
      }
      
      // No character inversion needed - cursor is always at end of input
    }
  }
}
