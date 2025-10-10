/**
 * TRS-80 Model 100 Main System
 * Coordinates all subsystems and manages the overall emulation
 * Non-module version for compatibility with old browsers
 */

// Wait for dependencies to load
(function() {
  'use strict';
  
  // Check if all dependencies are loaded
  function checkDependencies() {
    // Advanced renderer needs config, display, keyboard, BASIC, and the vertical font renderer
    return window.TRS80_CONFIG && 
           window.TRS80Display && 
           window.TRS80Keyboard && 
           window.TRS80Basic &&
           window.FONT_DATA_VERTICAL &&
           typeof window.drawChar === 'function';
  }
  
  function initSystem() {
    if (!checkDependencies()) {
      console.log('Waiting for dependencies...');
      setTimeout(initSystem, 100);
      return;
    }

    // Indicate system version in debug area
    var sysVer = document.getElementById('system-version');
    if (sysVer) sysVer.textContent = 'Advanced Renderer';

    console.log('All dependencies loaded, creating TRS80System class...');
    
    window.TRS80System = class TRS80System {
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
    console.log('Initializing TRS-80 subsystems...');
    this.display = new TRS80Display(this.canvas);
    console.log('✓ Display initialized');
    this.keyboard = new TRS80Keyboard(this.display);
    console.log('✓ Keyboard initialized');
    this.basic = new TRS80Basic(this.display, this.keyboard);
    console.log('✓ BASIC interpreter initialized');
    
    // Connect BASIC interpreter to keyboard
    this.keyboard.setBasicInterpreter(this.basic);
    console.log('✓ BASIC connected to keyboard');
    
    // Set up the system
    this.setupSystem();
    
    // Start animation loop
    this.startAnimationLoop();
    
    // Show Apple IIe style prompt after system is ready
    setTimeout(() => {
      this.keyboard.showPrompt();
    }, 100);
    
    console.log('TRS-80 Model 100 system ready');
    // Initial greeting so screen isn't empty
    try {
      this.display.addChar('R');
      this.display.addChar('E');
      this.display.addChar('A');
      this.display.addChar('D');
      this.display.addChar('Y');
      this.display.addChar('\n');
    } catch(e){ console.warn('Failed to write READY message', e); }
  }
  
  /**
   * Set up system configuration and focus
   */
  setupSystem() {
    // Focus container for keyboard input
    this.container.focus();
    
    // Add touch input support for Kindle/mobile
    this.setupTouchInput();
    
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
   * Set up touch input support for mobile/Kindle devices
   */
  setupTouchInput() {
    // Create invisible input field to capture keyboard input
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'text';
    hiddenInput.id = 'hidden-input';
    hiddenInput.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    `;
    document.body.appendChild(hiddenInput);
    
    // Focus hidden input when canvas is tapped
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      hiddenInput.focus();
      console.log('Canvas tapped - focusing hidden input for keyboard');
    });
    
    this.canvas.addEventListener('click', (e) => {
      hiddenInput.focus();
      console.log('Canvas clicked - focusing hidden input for keyboard');
    });
    
    // Capture input from hidden field
    hiddenInput.addEventListener('input', (e) => {
      const char = e.target.value.slice(-1); // Get last character
      if (char) {
        console.log('Touch input received:', char);
        this.keyboard.processKeyInput(char);
        this.display.render();
      }
      // Clear the input to allow continuous typing
      setTimeout(() => { e.target.value = ''; }, 50);
    });
    
    // Handle special keys
    hiddenInput.addEventListener('keydown', (e) => {
      console.log('Key event on hidden input:', e.key);
      if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Escape') {
        this.keyboard.processKeyInput(e.key);
        this.display.render();
        e.preventDefault();
      }
    });
    
    console.log('✓ Touch input system initialized');
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
    }; // End of TRS80System class
    
    console.log('✓ TRS80System class created and available globally');
  }
  
  // Start the initialization check
  initSystem();
})(); // End of IIFE