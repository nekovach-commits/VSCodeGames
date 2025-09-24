/**
 * TRS-80 Model 100 Keyboard System
 * Handles both physical keyboard and on-screen keyboard input
 */

import { DEVICE_PATTERNS } from './trs80-config.js';

export class TRS80Keyboard {
  constructor(display) {
    this.display = display;
    this.setupPhysicalKeyboard();
    this.setupOnScreenKeyboard();
    
    console.log('TRS-80 Keyboard system initialized');
  }
  
  /**
   * Set up physical keyboard event listeners
   */
  setupPhysicalKeyboard() {
    document.addEventListener('keydown', (e) => this.handlePhysicalKey(e));
  }
  
  /**
   * Handle physical keyboard input
   * @param {KeyboardEvent} e - Keyboard event
   */
  handlePhysicalKey(e) {
    this.processKeyInput(e.key);
    this.display.render();
    e.preventDefault();
  }
  
  /**
   * Set up on-screen keyboard for mobile devices
   */
  setupOnScreenKeyboard() {
    const keyboardContainer = document.getElementById('trs80-keyboard-container');
    const desktopInfo = document.getElementById('desktop-info');
    
    if (keyboardContainer && desktopInfo) {
      // Enhanced debugging for Kindle ColorSoft compatibility
      console.log('=== DEVICE DETECTION DEBUG ===');
      console.log('User agent:', navigator.userAgent);
      console.log('Window width:', window.innerWidth);
      console.log('Window height:', window.innerHeight);
      console.log('Screen width:', screen.width);
      console.log('Screen height:', screen.height);
      console.log('Device pixel ratio:', window.devicePixelRatio);
      console.log('Touch support:', 'ontouchstart' in window);
      console.log('Mobile regex test:', DEVICE_PATTERNS.MOBILE_REGEX.test(navigator.userAgent));
      console.log('Width threshold test:', window.innerWidth < DEVICE_PATTERNS.MOBILE_WIDTH_THRESHOLD);
      
      if (this.isMobileDevice()) {
        console.log('✅ Mobile/Kindle device detected - showing TRS-80 keyboard');
        keyboardContainer.style.display = 'block';
        desktopInfo.style.display = 'none'; // Hide desktop info to save space
        this.initializeOnScreenKeyboard();
      } else {
        console.log('❌ Desktop device detected - hiding keyboard');
        keyboardContainer.style.display = 'none';
        desktopInfo.style.display = 'block'; // Show desktop info
      }
    }
  }
  
  /**
   * Check if current device is mobile/tablet with enhanced Kindle detection
   * @returns {boolean} True if mobile device
   */
  isMobileDevice() {
    // Check user agent first
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = DEVICE_PATTERNS.MOBILE_REGEX.test(navigator.userAgent);
    
    // Check screen width
    const isNarrowScreen = window.innerWidth < DEVICE_PATTERNS.MOBILE_WIDTH_THRESHOLD;
    
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Special Kindle ColorSoft detection
    const isKindleColorSoft = userAgent.includes('colorsoft') || 
                             userAgent.includes('kindle') ||
                             userAgent.includes('silk');
    
    // Combine all detection methods
    const isMobile = isMobileUA || isNarrowScreen || (hasTouch && isKindleColorSoft);
    
    console.log('📱 Mobile Detection Results:');
    console.log('  User Agent Mobile:', isMobileUA);
    console.log('  Narrow Screen:', isNarrowScreen);
    console.log('  Has Touch:', hasTouch);
    console.log('  Kindle ColorSoft:', isKindleColorSoft);
    console.log('  Final Result:', isMobile);
    
    return isMobile;
  }
  
  /**
   * Initialize on-screen keyboard event handlers
   */
  initializeOnScreenKeyboard() {
    console.log('Setting up TRS-80 on-screen keyboard...');
    
    const keyButtons = document.querySelectorAll('.trs80-key');
    
    keyButtons.forEach(button => {
      // Handle click events  
      button.addEventListener('click', (e) => this.handleOnScreenKey(e, button));
      
      // Enhanced touch handling for mobile devices
      let touchHandled = false;
      
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchHandled = false;
        this.addButtonPressedEffect(button);
      }, { passive: false });
      
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.removeButtonPressedEffect(button);
        
        if (!touchHandled) {
          touchHandled = true;
          setTimeout(() => {
            this.processKeyInput(button.getAttribute('data-key'));
            this.display.render();
          }, 50);
        }
      }, { passive: false });
      
      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.removeButtonPressedEffect(button);
        touchHandled = true;
      }, { passive: false });
    });
  }
  
  /**
   * Add visual feedback for button press
   * @param {HTMLElement} button - Button element
   */
  addButtonPressedEffect(button) {
    button.style.transform = 'scale(0.95)';
    button.style.backgroundColor = '#b0c0a0';
  }
  
  /**
   * Remove visual feedback for button press  
   * @param {HTMLElement} button - Button element
   */
  removeButtonPressedEffect(button) {
    button.style.transform = 'scale(1)';
    button.style.backgroundColor = '';
  }
  
  /**
   * Handle on-screen keyboard button press
   * @param {Event} e - Click event
   * @param {HTMLElement} button - Button element
   */
  handleOnScreenKey(e, button) {
    e.preventDefault();
    this.processKeyInput(button.getAttribute('data-key'));
    this.display.render();
  }
  
  /**
   * Process key input from either physical or on-screen keyboard
   * @param {string} keyValue - Key value to process
   */
  processKeyInput(keyValue) {
    // Handle special navigation and editing keys
    switch (keyValue) {
      case 'Backspace':
        this.display.removeChar();
        break;
      case 'Enter':
        this.display.addChar('\n');
        break;
      case 'Tab':
        this.display.addChar('    '); // 4 spaces for tab
        break;
      case 'Escape':
        this.display.clearScreen();
        break;
      case 'ArrowUp':
        this.display.moveCursorUp();
        break;
      case 'ArrowDown':
        this.display.moveCursorDown();
        break;
      case 'ArrowLeft':
        this.display.moveCursorLeft();
        break;
      case 'ArrowRight':
        this.display.moveCursorRight();
        break;
      case ' ':
        this.display.addChar(' ');
        break;
      default:
        // Handle printable characters and ignore modifier keys
        if (keyValue.length === 1) {
          this.display.addChar(keyValue);
        }
        // Ignore modifier keys (Shift, Control, CapsLock, function keys)
        break;
    }
  }
}