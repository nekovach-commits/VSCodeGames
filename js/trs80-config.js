/**
 * TRS-80 Model 100 Configuration and Constants
 * Contains all hardware specifications and system constants
 * @fileoverview Central configuration for TRS-80 Model 100 emulator
 */

// TRS-80 Model 100 Hardware Specifications
export const TRS80_CONFIG = {
  // === DISPLAY GRID SPECIFICATIONS ===
  SCREEN_WIDTH: 40,          // Characters per row
  SCREEN_HEIGHT: 10,         // Visible rows (extended from original 8)
  BUFFER_SIZE: 1000,         // Total scrollable buffer rows
  
  // === PIXEL RENDERING SPECIFICATIONS ===
  PIXEL_SIZE: 4,             // Screen pixels per font pixel (4×4)
  CHAR_WIDTH: 6 * 4,         // Character cell width (24px)
  CHAR_HEIGHT: 8 * 4,        // Character cell height (32px)
  
  // === DISPLAY LAYOUT SPECIFICATIONS ===
  BORDER_SIZE: 20,           // Screen border width in pixels
  CANVAS_WIDTH: 1000,        // Total canvas width
  CANVAS_HEIGHT: 360,        // Total canvas height
  
  // === COLOR SCHEME ===
  BACKGROUND_COLOR: '#ffffff',  // White background
  TEXT_COLOR: '#000000',        // Black text and cursor
  INACTIVE_COLOR: '#cccccc',    // Light grey for UI elements
  
  // === CURSOR BEHAVIOR ===
  CURSOR_BLINK_RATE: 500        // Blink interval in milliseconds
};

// Device detection configuration for responsive keyboard
export const DEVICE_PATTERNS = {
  MOBILE_REGEX: /Mobi|Android|iPhone|iPad|Kindle|Silk/i,
  MOBILE_WIDTH_THRESHOLD: 800
};