/**
 * TRS-80 Model 100 Configuration and Constants
 * Contains all hardware specifications and system constants
 */

// TRS-80 Model 100 Hardware Specifications
export const TRS80_CONFIG = {
  // Display specifications
  SCREEN_WIDTH: 40,        // 40 characters wide
  SCREEN_HEIGHT: 10,       // 10 lines visible (8 lines on original, but we use 10)
  BUFFER_SIZE: 1000,       // Scrollable text buffer size
  
  // Display rendering
  PIXEL_SIZE: 4,           // Each display pixel is 4x4 screen pixels
  PIXEL_DOT_SIZE: 3,       // Each visible pixel dot is 3x3 with 1px white border
  CHAR_WIDTH: 6 * 4,       // 6 pixels per character = 24px
  CHAR_HEIGHT: 8 * 4,      // 8 pixels per line = 32px
  BORDER_SIZE: 20,         // Border around display
  
  // Display colors (Black and white with grey pixels)
  BACKGROUND_COLOR: '#ffffff',  // White background
  TEXT_COLOR: '#000000',        // Black text
  GRID_COLOR: '#cccccc',        // Light grey for inactive pixels
  
  // Canvas dimensions
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 360,
  
  // Cursor settings
  CURSOR_BLINK_RATE: 500   // Milliseconds between blinks
};

// Device detection patterns
export const DEVICE_PATTERNS = {
  MOBILE_REGEX: /Mobi|Android|iPhone|iPad|Kindle|Silk/i,
  MOBILE_WIDTH_THRESHOLD: 800
};