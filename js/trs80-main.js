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
    
    // Update resolution display
    this.updateResolutionInfo();
    
    // Initial render
    this.display.render();
  }
  
  /**
   * Update resolution information display
   */
  updateResolutionInfo() {
    const resolutionInfo = document.getElementById('resolution-info');
    if (resolutionInfo) {
      resolutionInfo.textContent = `${window.innerWidth}x${window.innerHeight} (Canvas: ${this.canvas.width}x${this.canvas.height})`;
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