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
    console.log('Physical key:', e.key);
    
    if (e.key.length === 1) {
      this.display.addChar(e.key);
    } else if (e.key === 'Enter') {
      this.display.addChar('\n');
    } else if (e.key === 'Backspace') {
      this.display.removeChar();
    } else if (e.key === 'ArrowUp') {
      this.display.moveCursorUp();
    } else if (e.key === 'ArrowDown') {
      this.display.moveCursorDown();
    } else if (e.key === 'ArrowLeft') {
      this.display.moveCursorLeft();
    } else if (e.key === 'ArrowRight') {
      this.display.moveCursorRight();
    } else if (e.key === 'Escape') {
      this.display.clearScreen();
    }
    
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
      console.log('User agent:', navigator.userAgent);
      console.log('Window width:', window.innerWidth);
      
      if (this.isMobileDevice()) {
        console.log('Mobile/Kindle device detected - showing TRS-80 keyboard');
        keyboardContainer.style.display = 'block';
        desktopInfo.style.display = 'none'; // Hide desktop info to save space
        this.initializeOnScreenKeyboard();
      } else {
        console.log('Desktop device detected - hiding keyboard');
        keyboardContainer.style.display = 'none';
        desktopInfo.style.display = 'block'; // Show desktop info
      }
    }
  }
  
  /**
   * Check if current device is mobile/tablet
   * @returns {boolean} True if mobile device
   */
  isMobileDevice() {
    return DEVICE_PATTERNS.MOBILE_REGEX.test(navigator.userAgent) || 
           window.innerWidth < DEVICE_PATTERNS.MOBILE_WIDTH_THRESHOLD;
  }
  
  /**
   * Initialize on-screen keyboard event handlers
   */
  initializeOnScreenKeyboard() {
    console.log('Setting up TRS-80 on-screen keyboard...');
    
    // Get all keyboard buttons
    const keyButtons = document.querySelectorAll('.trs80-key');
    
    keyButtons.forEach(button => {
      // Handle both click and touch events for maximum compatibility
      button.addEventListener('click', (e) => this.handleOnScreenKey(e, button));
      
      // Touch event handling for Kindle/mobile
      let touchHandled = false;
      
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchHandled = false;
        button.style.transform = 'scale(0.95)';
        button.style.backgroundColor = '#b0c0a0';
      }, { passive: false });
      
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = '';
        
        if (!touchHandled) {
          touchHandled = true;
          const keyValue = button.getAttribute('data-key');
          
          // Small delay to ensure visual feedback is seen
          setTimeout(() => {
            this.processKeyInput(keyValue);
          }, 50);
        }
      }, { passive: false });
      
      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = '';
        touchHandled = true;
      }, { passive: false });
    });
  }
  
  /**
   * Handle on-screen keyboard button press
   * @param {Event} e - Click event
   * @param {HTMLElement} button - Button element
   */
  handleOnScreenKey(e, button) {
    e.preventDefault();
    e.stopPropagation();
    const keyValue = button.getAttribute('data-key');
    this.processKeyInput(keyValue);
  }
  
  /**
   * Process key input from either physical or on-screen keyboard
   * @param {string} keyValue - Key value to process
   */
  processKeyInput(keyValue) {
    console.log('TRS-80 key processed:', keyValue);
    
    // Handle special keys
    if (keyValue === 'Backspace') {
      this.display.removeChar();
    } else if (keyValue === 'Enter') {
      this.display.addChar('\n');
    } else if (keyValue === 'Escape') {
      this.display.clearScreen();
    } else if (keyValue === 'ArrowUp') {
      this.display.moveCursorUp();
    } else if (keyValue === 'ArrowDown') {
      this.display.moveCursorDown();
    } else if (keyValue === 'ArrowLeft') {
      this.display.moveCursorLeft();
    } else if (keyValue === 'ArrowRight') {
      this.display.moveCursorRight();
    } else if (keyValue.startsWith('F')) {
      // Function keys - could add special functionality later
      console.log('Function key pressed:', keyValue);
    } else if (keyValue === ' ') {
      // Space key
      this.display.addChar(' ');
    } else if (keyValue.length === 1) {
      // Regular character
      this.display.addChar(keyValue);
    }
    
    this.display.render();
  }
}