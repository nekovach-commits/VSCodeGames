/**
 * TRS-80 Model 100 Configuration and Constants
 * Contains all hardware specifications and system constants
 * @fileoverview Central configuration for TRS-80 Model 100 emulator
 */

// Detect device and set optimal pixel scaling
function getOptimalPixelSize() {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Kindle ColorSoft (636×848) - use 2×2 pixel scaling
  if (screenWidth === 636 && screenHeight === 848) {
    return 2;
  }
  
  // Mobile devices - use 2×2 or 3×3
  if (screenWidth <= 768) {
    return 2;
  }
  
  // Desktop/larger screens - use 4×4 (original)
  return 4;
}

const OPTIMAL_PIXEL_SIZE = getOptimalPixelSize();

// TRS-80 Model 100 Hardware Specifications
export const TRS80_CONFIG = {
  // === DISPLAY GRID SPECIFICATIONS ===
  SCREEN_WIDTH: 40,          // Characters per row
  SCREEN_HEIGHT: 10,         // Visible rows (extended from original 8)
  BUFFER_SIZE: 1000,         // Total scrollable buffer rows
  
  // === PIXEL RENDERING SPECIFICATIONS ===
  PIXEL_SIZE: OPTIMAL_PIXEL_SIZE,                    // Screen pixels per font pixel (adaptive)
  CHAR_WIDTH: 6 * OPTIMAL_PIXEL_SIZE,                // Character cell width
  CHAR_HEIGHT: 8 * OPTIMAL_PIXEL_SIZE,               // Character cell height
  
  // === DISPLAY LAYOUT SPECIFICATIONS ===
  BORDER_SIZE: 10,                                   // Reduced border for smaller screens
  CANVAS_WIDTH: (40 * 6 * OPTIMAL_PIXEL_SIZE) + 20, // 40 chars × 6 pixels × scale + borders
  CANVAS_HEIGHT: (10 * 8 * OPTIMAL_PIXEL_SIZE) + 20, // 10 rows × 8 pixels × scale + borders
  
  // === COLOR SCHEME ===
  BACKGROUND_COLOR: '#ffffff',  // White background
  TEXT_COLOR: '#000000',        // Black text and cursor
  INACTIVE_COLOR: '#cccccc',    // Light grey for UI elements
  
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