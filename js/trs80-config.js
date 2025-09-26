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
export const TRS80_CONFIG = {
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
  
  // === COMMODORE 64 COLOR PALETTE ===
  // Authentic C64 colors based on original hardware specifications
  C64_COLORS: {
    0: { name: 'BLACK',       hex: '#000000', rgb: [0,   0,   0  ] },
    1: { name: 'WHITE',       hex: '#FFFFFF', rgb: [255, 255, 255] },
    2: { name: 'RED',         hex: '#68372B', rgb: [104, 55,  43 ] },
    3: { name: 'CYAN',        hex: '#70A4B2', rgb: [112, 164, 178] },
    4: { name: 'PURPLE',      hex: '#6F3D86', rgb: [111, 61,  134] },
    5: { name: 'GREEN',       hex: '#588D43', rgb: [88,  141, 67 ] },
    6: { name: 'BLUE',        hex: '#352879', rgb: [53,  40,  121] },
    7: { name: 'YELLOW',      hex: '#B8C76F', rgb: [184, 199, 111] },
    8: { name: 'ORANGE',      hex: '#6F4F25', rgb: [111, 79,  37 ] },
    9: { name: 'BROWN',       hex: '#433900', rgb: [67,  57,  0  ] },
    10: { name: 'LIGHT RED',   hex: '#9A6759', rgb: [154, 103, 89 ] },
    11: { name: 'DARK GREY',   hex: '#444444', rgb: [68,  68,  68 ] },
    12: { name: 'GREY',        hex: '#6C6C6C', rgb: [108, 108, 108] },
    13: { name: 'LIGHT GREEN', hex: '#9AD284', rgb: [154, 210, 132] },
    14: { name: 'LIGHT BLUE',  hex: '#6C5EB5', rgb: [108, 94,  181] },
    15: { name: 'LIGHT GREY',  hex: '#959595', rgb: [149, 149, 149] }
  },
  
  // Default C64-style colors
  DEFAULT_TEXT_COLOR: 14,      // Light Blue (C64 startup color)
  DEFAULT_BACKGROUND_COLOR: -1, // Transparent (white background)
  
  // === CURSOR BEHAVIOR ===
  CURSOR_BLINK_RATE: 500        // Blink interval in milliseconds
};

// Device detection configuration for responsive keyboard
export const DEVICE_PATTERNS = {
  // Enhanced regex to catch more Kindle variations and ColorSoft specifically
  MOBILE_REGEX: /Mobi|Android|iPhone|iPad|Kindle|Silk|ColorSoft|KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA/i,
  MOBILE_WIDTH_THRESHOLD: 900,  // Increased from 800 to catch more tablet-sized devices
  
  // Specific Kindle ColorSoft detection
  KINDLE_COLORSOFT_WIDTH: 1264,
  KINDLE_COLORSOFT_HEIGHT: 1680
};

// Enhanced device detection function
export function detectKindleColorSoft() {
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