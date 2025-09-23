// display.js - TRS-80 Model 100 Display and Graphics Module

class Display {
  constructor() {
    // Display configuration
    this.BLOCK_SIZE = 4; // 4x4 pixels for maximum crispness
    this.GAP = 1;
    this.CELL = this.BLOCK_SIZE + this.GAP;
    
    // Character grid dimensions
    this.CHARS_WIDE = 40;
    this.LINES_TALL = 10;
    this.BORDER_SIZE = 4;
    
    // Canvas dimensions
    this.LOGICAL_WIDTH = 0;
    this.LOGICAL_HEIGHT = 0;
    
    // Canvas references
    this.canvas = null;
    this.ctx = null;
    
    // Colors
    this.BACKGROUND_COLOR = '#c8d4b8'; // Light green LCD background
    this.GRID_COLOR = '#b0c0a0'; // Slightly darker green for background grid blocks
    this.TEXT_COLOR = '#1a3d1a'; // Dark green text blocks
    this.BORDER_COLOR = '#1a3d1a'; // Dark green border
  }
  
  init() {
    this.canvas = document.getElementById('retro-canvas');
    if (!this.canvas) {
      console.error('Canvas element retro-canvas not found');
      return this;
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Could not get 2D context from canvas');
      return this;
    }
    
    console.log('Display initialized successfully');
    this.setupCanvas();
    return this;
  }
  
  getScreenDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  
  setupCanvas() {
    const { width, height, pixelRatio } = this.getScreenDimensions();
    
    console.log('Setting up canvas with screen dimensions:', { width, height, pixelRatio });
    
    // Calculate responsive scaling for different devices
    const baseCharWidth = (5 + 1) * this.CELL; // 6 cells per character  
    const baseLineHeight = (7 + 1) * this.CELL; // 8 cells per line
    const baseWidth = (this.CHARS_WIDE * baseCharWidth) + (this.BORDER_SIZE * 2);
    const baseHeight = (this.LINES_TALL * baseLineHeight) + (this.BORDER_SIZE * 2);
    
    console.log('Calculated base dimensions:', { baseWidth, baseHeight, baseCharWidth, baseLineHeight });
    
    // Calculate scale factors separately for width and height
    const availableWidth = width * 0.9; // Use 90% of screen width
    const availableHeight = height * 0.7; // Use 70% of screen height
    
    let scaleFactorX = availableWidth / baseWidth;
    let scaleFactorY = availableHeight / baseHeight;
    
    // Detect Kindle devices and adjust for their aspect ratios
    const isKindleColorsoft = (width === 636 && height === 740) || (pixelRatio === 2 && width > 600 && width < 700);
    const isKindleScribe = width > 1000 && height > 1000;
    
    if (isKindleColorsoft) {
      // Kindle Colorsoft: reduce vertical scaling to prevent stretching (1/3 size)
      scaleFactorY *= 0.33; // Squish vertically to 1/3 size
      console.log('Kindle Colorsoft detected - applying aggressive vertical compression (1/3 size)');
    } else if (isKindleScribe) {
      // Kindle Scribe: different aspect ratio handling
      scaleFactorY *= 0.5; // More compression for Scribe too
      console.log('Kindle Scribe detected - applying aspect ratio correction');
    }
    
    // Ensure minimum readable size
    scaleFactorX = Math.max(scaleFactorX, 1);
    scaleFactorY = Math.max(scaleFactorY, 1);
    
    // Round for crisp rendering
    scaleFactorX = Math.round(scaleFactorX);
    scaleFactorY = Math.round(scaleFactorY);
    
    // Set dimensions with safety checks
    this.LOGICAL_WIDTH = Math.max(baseWidth, 320); // Minimum 320px wide
    this.LOGICAL_HEIGHT = Math.max(baseHeight, 200); // Minimum 200px tall
    
    console.log('Setting logical dimensions:', { LOGICAL_WIDTH: this.LOGICAL_WIDTH, LOGICAL_HEIGHT: this.LOGICAL_HEIGHT });
    
    // Configure canvas with separate X and Y scaling
    this.canvas.width = this.LOGICAL_WIDTH;
    this.canvas.height = this.LOGICAL_HEIGHT;
    this.canvas.style.width = (this.LOGICAL_WIDTH * scaleFactorX) + 'px';
    this.canvas.style.height = (this.LOGICAL_HEIGHT * scaleFactorY) + 'px';
    
    console.log(`Display setup complete: screen=${width}x${height}, logical=${this.LOGICAL_WIDTH}x${this.LOGICAL_HEIGHT}, styled=${this.LOGICAL_WIDTH * scaleFactorX}x${this.LOGICAL_HEIGHT * scaleFactorY}, scaleX=${scaleFactorX}, scaleY=${scaleFactorY}`);
    
    // Disable image smoothing for crisp scaling
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
    
    // Force an initial clear to ensure canvas is working
    this.clearScreen();
  }
  
  clearScreen() {
    this.ctx.fillStyle = this.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.LOGICAL_WIDTH, this.LOGICAL_HEIGHT);
    
    // Draw authentic LCD background grid
    this.drawBackgroundGrid();
  }
  
  drawBackgroundGrid() {
    this.ctx.fillStyle = this.GRID_COLOR;
    
    // Calculate the text area dimensions
    const textAreaWidth = this.CHARS_WIDE * (5 + 1) * this.CELL; // 40 chars * 6 cells each
    const textAreaHeight = this.LINES_TALL * (7 + 1) * this.CELL; // 10 lines * 8 cells each
    
    // Starting position (after border)
    const startX = this.BORDER_SIZE;
    const startY = this.BORDER_SIZE;
    
    // Draw grid of background blocks covering the entire text area
    for (let row = 0; row < this.LINES_TALL * 8; row++) { // 8 cells per line
      for (let col = 0; col < this.CHARS_WIDE * 6; col++) { // 6 cells per character
        const x = startX + col * this.CELL;
        const y = startY + row * this.CELL;
        
        // Only draw if within bounds
        if (x + this.BLOCK_SIZE <= this.LOGICAL_WIDTH - this.BORDER_SIZE && 
            y + this.BLOCK_SIZE <= this.LOGICAL_HEIGHT - this.BORDER_SIZE) {
          this.drawPixelBlock(x, y, this.BLOCK_SIZE);
        }
      }
    }
  }
  
  drawBorder() {
    this.ctx.fillStyle = this.BORDER_COLOR;
    const borderThickness = this.BORDER_SIZE;
    
    // Simple rectangular border like TRS-80 Model 100
    this.ctx.fillRect(0, 0, this.LOGICAL_WIDTH, borderThickness); // Top
    this.ctx.fillRect(0, this.LOGICAL_HEIGHT - borderThickness, this.LOGICAL_WIDTH, borderThickness); // Bottom
    this.ctx.fillRect(0, 0, borderThickness, this.LOGICAL_HEIGHT); // Left
    this.ctx.fillRect(this.LOGICAL_WIDTH - borderThickness, 0, borderThickness, this.LOGICAL_HEIGHT); // Right
  }
  
  drawPixelBlock(x, y, blockSize = this.BLOCK_SIZE, color = null) {
    if (color) {
      const oldColor = this.ctx.fillStyle;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, blockSize, blockSize);
      this.ctx.fillStyle = oldColor;
    } else {
      this.ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
  
  setTextColor() {
    this.ctx.fillStyle = this.TEXT_COLOR;
  }
  
  getTextStartPosition() {
    return {
      x: this.BORDER_SIZE,
      y: this.BORDER_SIZE
    };
  }
  
  getCharacterDimensions() {
    return {
      width: (5 + 1) * this.CELL, // 5 pixel character + 1 space
      height: (7 + 1) * this.CELL  // 7 pixel height + 1 space
    };
  }
  
  updateResolutionInfo() {
    const { width, height, pixelRatio } = this.getScreenDimensions();
    const resolutionElement = document.getElementById('resolution-info');
    if (resolutionElement) {
      const cssWidth = parseInt(this.canvas.style.width);
      const cssHeight = parseInt(this.canvas.style.height);
      const scaleFactor = Math.round(cssWidth / this.LOGICAL_WIDTH);
      
      resolutionElement.textContent = `${width}×${height} screen • ${this.LOGICAL_WIDTH}×${this.LOGICAL_HEIGHT} canvas • ${scaleFactor}× scale • Pixel Ratio: ${pixelRatio}`;
    }
  }
}

// Export for use in other modules
window.Display = Display;