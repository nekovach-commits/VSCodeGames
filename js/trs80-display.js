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
    
    // Set canvas dimensions
    this.canvas.width = TRS80_CONFIG.CANVAS_WIDTH;
    this.canvas.height = TRS80_CONFIG.CANVAS_HEIGHT;
    
    // Display state
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
    this.textBuffer = [];
    this.cursorVisible = true;
    this.lastBlinkTime = Date.now();
    
    // Initialize text buffer
    this.initializeBuffer();
    
    console.log('TRS-80 Display initialized');
  }
  
  /**
   * Initialize the text buffer with empty spaces
   */
  initializeBuffer() {
    for (let i = 0; i < TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
    }
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
   * Clear the screen
   */
  clearScreen() {
    for (let i = 0; i < TRS80_CONFIG.BUFFER_SIZE; i++) {
      this.textBuffer[i] = new Array(TRS80_CONFIG.SCREEN_WIDTH).fill(' ');
    }
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
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
    const { PIXEL_SIZE, CHAR_WIDTH, CHAR_HEIGHT, BORDER_SIZE } = TRS80_CONFIG;
    
    // Handle cursor blinking
    const currentTime = Date.now();
    if (currentTime - this.lastBlinkTime > TRS80_CONFIG.CURSOR_BLINK_RATE) {
      this.cursorVisible = !this.cursorVisible;
      this.lastBlinkTime = currentTime;
    }
    
    // Clear canvas with white background
    this.ctx.fillStyle = TRS80_CONFIG.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw black border frame
    this.ctx.fillStyle = TRS80_CONFIG.TEXT_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, BORDER_SIZE); // Top
    this.ctx.fillRect(0, this.canvas.height - BORDER_SIZE, this.canvas.width, BORDER_SIZE); // Bottom  
    this.ctx.fillRect(0, 0, BORDER_SIZE, this.canvas.height); // Left
    this.ctx.fillRect(this.canvas.width - BORDER_SIZE, 0, BORDER_SIZE, this.canvas.height); // Right
    
    // Render visible text from buffer
    for (let screenRow = 0; screenRow < TRS80_CONFIG.SCREEN_HEIGHT; screenRow++) {
      const bufferRow = screenRow + this.scrollOffset;
      if (bufferRow >= 0 && bufferRow < TRS80_CONFIG.BUFFER_SIZE) {
        for (let col = 0; col < TRS80_CONFIG.SCREEN_WIDTH; col++) {
          const char = this.textBuffer[bufferRow][col];
          if (char && char !== ' ') {
            const x = BORDER_SIZE + col * CHAR_WIDTH;
            const y = BORDER_SIZE + screenRow * CHAR_HEIGHT;
            drawChar(this.ctx, char, x, y, PIXEL_SIZE, TRS80_CONFIG.TEXT_COLOR);
          }
        }
      }
    }
    
    // Render blinking cursor when visible on screen
    const screenCursorRow = this.cursorRow - this.scrollOffset;
    if (screenCursorRow >= 0 && screenCursorRow < TRS80_CONFIG.SCREEN_HEIGHT && this.cursorVisible) {
      const cursorX = BORDER_SIZE + this.cursorCol * CHAR_WIDTH;
      const cursorY = BORDER_SIZE + screenCursorRow * CHAR_HEIGHT;
      
      // Draw solid 6×8 cursor block
      this.ctx.fillStyle = TRS80_CONFIG.TEXT_COLOR;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          const pixelX = cursorX + c * PIXEL_SIZE;
          const pixelY = cursorY + r * PIXEL_SIZE;
          this.ctx.fillRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
        }
      }
      
      // Invert character if present at cursor position
      const charAtCursor = this.textBuffer[this.cursorRow]?.[this.cursorCol];
      if (charAtCursor && charAtCursor !== ' ') {
        drawChar(this.ctx, charAtCursor, cursorX, cursorY, PIXEL_SIZE, TRS80_CONFIG.BACKGROUND_COLOR);
      }
    }
  }
}