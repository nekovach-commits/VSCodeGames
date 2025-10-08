/**
 * TRS-80 Model 100 Configuration and Constants
 * Contains all hardware specifications and system constants
 * @fileoverview Central configuration for TRS-80 Model 100 emulator
 */

// Simple resolution-based pixel size detection
function getOptimalPixelSize() {
  const w = window.screen.width;
  const h = window.screen.height;
  
  // Specific device resolutions  
  if (w === 636 && h === 848) return 2;  // Kindle ColorSoft
  if (w === 930 && h === 1240) return 3; // Kindle Scribe
  
  // General size categories
  if (w <= 768) return 2;  // Mobile devices  
  return 4;                // Desktop/large screens
}

const OPTIMAL_PIXEL_SIZE = getOptimalPixelSize();

// TRS-80 Model 100 Hardware Specifications
window.TRS80_CONFIG = {
  // === DISPLAY GRID SPECIFICATIONS ===
  SCREEN_WIDTH: 40,          // Characters per row
  SCREEN_HEIGHT: 20,         // Visible rows (extended from original 10)
  BUFFER_SIZE: 1000,         // Total scrollable buffer rows
  
  // === PIXEL RENDERING SPECIFICATIONS ===
  PIXEL_SIZE: OPTIMAL_PIXEL_SIZE,                    // Screen pixels per font pixel (adaptive)
  CHAR_WIDTH: 6 * OPTIMAL_PIXEL_SIZE,                // Character cell width
  CHAR_HEIGHT: 8 * OPTIMAL_PIXEL_SIZE,               // Character cell height
  
  // === DISPLAY LAYOUT SPECIFICATIONS ===
  BORDER_SIZE: 10,                                   // Reduced border for smaller screens
  CANVAS_WIDTH: (40 * 6 * OPTIMAL_PIXEL_SIZE) + 20, // 40 chars × 6 pixels × scale + borders
  CANVAS_HEIGHT: (20 * 8 * OPTIMAL_PIXEL_SIZE) + 20, // 20 rows × 8 pixels × scale + borders
  
  // === COLOR SCHEME ===
  BACKGROUND_COLOR: '#ffffff',  // White background
  TEXT_COLOR: '#000000',        // Black text and cursor
  INACTIVE_COLOR: '#cccccc',    // Light grey for UI elements
  
  // === APPLE IIe 16-COLOR PALETTE ===
  // Most common Apple IIe colors (Double Hi-Res)
  C64_COLORS: {
    0:  { name: 'BLACK',        hex: '#000000', rgb: [0, 0, 0] },
    1:  { name: 'MAGENTA',      hex: '#DD09DD', rgb: [221, 9, 221] },
    2:  { name: 'DARK BLUE',    hex: '#0000B2', rgb: [0, 0, 178] },
    3:  { name: 'PURPLE',       hex: '#B200B2', rgb: [178, 0, 178] },
    4:  { name: 'DARK GREEN',   hex: '#00B200', rgb: [0, 178, 0] },
    5:  { name: 'GRAY1',        hex: '#B2B2B2', rgb: [178, 178, 178] },
    6:  { name: 'MEDIUM BLUE',  hex: '#0000FF', rgb: [0, 0, 255] },
    7:  { name: 'LIGHT BLUE',   hex: '#09DDDD', rgb: [9, 221, 221] },
    8:  { name: 'BROWN',        hex: '#B26509', rgb: [178, 101, 9] },
    9:  { name: 'ORANGE',       hex: '#FF9900', rgb: [255, 153, 0] },
    10: { name: 'GRAY2',        hex: '#DDDDDD', rgb: [221, 221, 221] },
    11: { name: 'PINK',         hex: '#FFB2B2', rgb: [255, 178, 178] },
    12: { name: 'YELLOW',       hex: '#FFFF00', rgb: [255, 255, 0] },
    13: { name: 'GREEN',        hex: '#00FF00', rgb: [0, 255, 0] },
    14: { name: 'AQUA',         hex: '#00FFFF', rgb: [0, 255, 255] },
    15: { name: 'WHITE',        hex: '#FFFFFF', rgb: [255, 255, 255] }
  },
  
  // Default C64-style colors
  DEFAULT_TEXT_COLOR: 0,      // Black (Apple IIe default)
  DEFAULT_BACKGROUND_COLOR: -1, // Transparent (white background)
  BORDER_COLOR_INDEX: 5, // Use GRAY1 (Apple IIe color index 5) for border
  
  // === CURSOR BEHAVIOR ===
  CURSOR_BLINK_RATE: 500        // Blink interval in milliseconds
};

// Device detection configuration for responsive keyboard
window.DEVICE_PATTERNS = {
  // Enhanced regex to catch more Kindle variations and ColorSoft specifically
  MOBILE_REGEX: /Mobi|Android|iPhone|iPad|Kindle|Silk|ColorSoft|KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA/i,
  MOBILE_WIDTH_THRESHOLD: 900,  // Increased from 800 to catch more tablet-sized devices
  
  // Specific Kindle ColorSoft detection
  KINDLE_COLORSOFT_WIDTH: 1264,
  KINDLE_COLORSOFT_HEIGHT: 1680
};

// Enhanced device detection function
window.detectKindleColorSoft = function() {
  const ua = navigator.userAgent;
  const width = window.screen.width || window.innerWidth;
  const height = window.screen.height || window.innerHeight;
  
  // Check for Kindle ColorSoft specifically
  const isKindleColorSoft = (width === DEVICE_PATTERNS.KINDLE_COLORSOFT_WIDTH && 
                            height === DEVICE_PATTERNS.KINDLE_COLORSOFT_HEIGHT) ||
                           /Kindle.*ColorSoft/i.test(ua);
  
  const isKindle = /Kindle|Silk/i.test(ua) || isKindleColorSoft;
  
  console.log('Kindle Detection:', {
    userAgent: ua,
    screenSize: `${width}×${height}`,
    isKindleColorSoft,
    isKindle
  });
  
  return { isKindle, isKindleColorSoft, width, height };
}