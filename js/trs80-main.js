/**
 * TRS-80 Model 100 Main System
 * Coordinates all subsystems and manages the overall emulation
 */

import { TRS80_CONFIG } from './trs80-config.js';
import { TRS80Display } from './trs80-display.js';
import { TRS80Keyboard } from './trs80-keyboard.js';

export class TRS80System {
  constructor() {
    console.log('TRS-80 Model 100 system starting...');
    
    // Get canvas element
    this.canvas = document.getElementById('retro-canvas');
    this.container = document.getElementById('retro-container');
    
    if (!this.canvas) {
      console.error('Canvas element not found!');
      return;
    }
    
    // Initialize subsystems
    this.display = new TRS80Display(this.canvas);
    this.keyboard = new TRS80Keyboard(this.display);
    
    // Set up the system
    this.setupSystem();
    
    // Start animation loop
    this.startAnimationLoop();
    
    console.log('TRS-80 Model 100 system ready');
  }
  
  /**
   * Set up system configuration and focus
   */
  setupSystem() {
    // Focus container for keyboard input
    this.container.focus();
    
    // Update resolution display with enhanced information
    this.updateResolutionInfo();
    
    // Set up manual keyboard toggle
    this.setupKeyboardToggle();
    
    // Update resolution on window resize
    window.addEventListener('resize', () => {
      this.updateResolutionInfo();
    });
    
    // Initial render
    this.display.render();
  }
  
  /**
   * Update resolution information display with detailed debugging info
   */
  updateResolutionInfo() {
    const resolutionInfo = document.getElementById('resolution-info');
    if (resolutionInfo) {
      const info = [
        `${window.innerWidth}×${window.innerHeight}`,
        `Screen: ${screen.width}×${screen.height}`,
        `DPR: ${window.devicePixelRatio || 1}`,
        `Touch: ${'ontouchstart' in window ? 'Yes' : 'No'}`,
        `UA: ${navigator.userAgent.includes('Kindle') ? 'Kindle' : navigator.userAgent.includes('ColorSoft') ? 'ColorSoft' : 'Other'}`
      ].join(' • ');
      resolutionInfo.textContent = info;
    }
  }
  
  /**
   * Set up manual keyboard toggle for problematic devices
   */
  setupKeyboardToggle() {
    const desktopInfo = document.getElementById('desktop-info');
    if (desktopInfo) {
      const toggleButton = document.createElement('button');
      toggleButton.textContent = '📱 Toggle On-Screen Keyboard';
      toggleButton.style.cssText = `
        margin-top: 10px; 
        padding: 8px 16px; 
        background: linear-gradient(145deg, #f0f0f0, #e0e0e0); 
        border: 2px outset #f0f0f0; 
        border-radius: 4px; 
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      `;
      
      toggleButton.addEventListener('click', () => {
        const keyboardContainer = document.getElementById('trs80-keyboard-container');
        if (keyboardContainer) {
          const isVisible = keyboardContainer.style.display !== 'none';
          keyboardContainer.style.display = isVisible ? 'none' : 'block';
          console.log(`Keyboard manually ${isVisible ? 'hidden' : 'shown'}`);
          
          // Initialize keyboard if showing for first time
          if (!isVisible && !this.keyboard.keyboardInitialized) {
            this.keyboard.initializeOnScreenKeyboard();
            this.keyboard.keyboardInitialized = true;
          }
        }
      });
      
      desktopInfo.appendChild(toggleButton);
    }
  }
  
  /**
   * Start the animation loop for cursor blinking
   */
  startAnimationLoop() {
    const animate = () => {
      this.display.render();
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Get current system state (for debugging)
   */
  getSystemState() {
    return {
      cursorRow: this.display.cursorRow,
      cursorCol: this.display.cursorCol,
      scrollOffset: this.display.scrollOffset,
      cursorVisible: this.display.cursorVisible,
      bufferSize: this.display.textBuffer.length
    };
  }
}

// Initialize system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.trs80 = new TRS80System();
});