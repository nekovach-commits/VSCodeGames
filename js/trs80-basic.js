/**
 * TRS-80 Applesoft-style BASIC Interpreter
 * Supports graphics commands and classic BASIC programming
 */

export class TRS80Basic {
  constructor(display, keyboard) {
    this.display = display;
    this.keyboard = keyboard;
    
    // Program storage
    this.program = new Map(); // Line number -> command
    this.variables = new Map(); // Variable name -> value
    this.programCounter = 0;
    this.executionStack = []; // For GOSUB/RETURN
    this.forLoops = []; // For FOR/NEXT loops
    
    // Current execution state
    this.isRunning = false;
    this.isDirectMode = true; // Direct command vs program mode
    
    console.log('TRS-80 BASIC Interpreter initialized');
    // Startup message removed to match SimpleTRS80 fallback behavior
  }
  
  /**
   * Show BASIC startup message
   */
  showStartupMessage() {
    this.display.addChar('\n');
    this.display.setTextColor(7); // Yellow
    this.display.addChar('TRS-80 BASIC v1.0\n');
    this.display.setTextColor(14); // Light Blue
    this.display.addChar('Ready\n\n');
    console.log('✓ BASIC interpreter startup message displayed');
  }
  
  /**
   * Process a BASIC command line
   * @param {string} line - The BASIC command line
   */
  processLine(line) {
    console.log('BASIC processLine called with:', line);
    if (!line.trim()) return;
    
    // Create display interface for ES6 system
    const displayInterface = {
      addText: (text) => {
        for (let i = 0; i < text.length; i++) {
          this.display.addChar(text[i]);
        }
      },
      setTextColor: (colorIndex) => {
        this.display.setTextColor(colorIndex);
      },
      clearScreen: () => {
        this.display.clearScreen();
      }
    };
    
    // Process BASIC commands directly in advanced system
    if (!line.trim()) return;
    
    const originalLine = line;
    line = line.trim().toUpperCase();
    
    // Handle program lines (numbers)
    const numMatch = line.match(/^(\d+)\s*(.*)$/);
    if (numMatch) {
      const lineNum = parseInt(numMatch[1], 10);
      const command = numMatch[2];
      if (command) {
        this.program.set(lineNum, originalLine.substring(originalLine.indexOf(' ') + 1));
      } else {
        this.program.delete(lineNum);
      }
      return;
    }
    
    // Handle direct commands
    if (line.startsWith('PRINT ')) {
      const text = originalLine.substring(6).trim();
      if (text.startsWith('"') && text.endsWith('"')) {
        displayInterface.addText(text.slice(1, -1) + '\n');
      }
    } else if (line === 'CLS') {
      displayInterface.clearScreen();
    } else if (line === 'LIST') {
      const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
      for (const lineNum of sortedLines) {
        displayInterface.addText(lineNum + ' ' + this.program.get(lineNum) + '\n');
      }
    } else if (line === 'RUN') {
      const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
      for (const lineNum of sortedLines) {
        this.processLine(this.program.get(lineNum));
      }
    } else if (line.startsWith('COLOR ')) {
      const colorIndex = parseInt(line.substring(6), 10);
      if (!isNaN(colorIndex)) {
        displayInterface.setTextColor(colorIndex);
      }
    }
  }
  
  /**
   * Execute a BASIC command
   * @param {string} command - The command to execute
   */
  executeCommand(command) {
    console.log('BASIC executeCommand called with:', JSON.stringify(command));
    console.log('Command length:', command.length);
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    console.log('Command:', JSON.stringify(cmd), 'Args:', args);
    console.log('Args joined:', JSON.stringify(args.join(' ')));
    
    try {
      switch (cmd) {
        case 'PRINT':
          console.log('Processing PRINT command');
          const printArgs = args.join(' ');
          console.log('PRINT args to pass:', JSON.stringify(printArgs));
          this.cmdPrint(printArgs);
          break;
          
        case 'LET':
          this.cmdLet(parts.slice(1).join(' '));
          break;
          
        case 'RUN':
          this.cmdRun();
          break;
          
        case 'LIST':
          this.cmdList();
          break;
          
        case 'NEW':
          this.cmdNew();
          break;
          
        case 'CLS':
          this.cmdCls();
          break;
          
        case 'COLOR':
          this.cmdColor(parts.slice(1).join(' '));
          break;
          
        case 'PLOT':
          this.cmdPlot(parts.slice(1).join(' '));
          break;
          
        case 'LINE':
          this.cmdLine(parts.slice(1).join(' '));
          break;
          
        case 'HTAB':
          this.cmdHtab(parts.slice(1).join(' '));
          break;
          
        case 'VTAB':
          this.cmdVtab(parts.slice(1).join(' '));
          break;
          
        case 'HOME':
          this.cmdHome();
          break;
          
        case 'END':
          this.cmdEnd();
          break;
          
        default:
          this.display.setTextColor(2); // Red for errors
          this.display.addChar(`?SYNTAX ERROR\n`);
          this.display.setTextColor(14); // Back to light blue
          break;
      }
    } catch (error) {
      this.display.setTextColor(2); // Red
      this.display.addChar(`?ERROR: ${error.message}\n`);
      this.display.setTextColor(14); // Light Blue
    }
  }
  
  /**
   * PRINT command - display text or variables
   */
  cmdPrint(args) {
    console.log('cmdPrint called with args:', JSON.stringify(args));
    console.log('args type:', typeof args, 'length:', args ? args.length : 'null/undefined');
    
    if (!args || args.trim() === '') {
      console.log('No args - printing newline only');
      this.display.addChar('\n');
      return;
    }

    // Handle quoted strings and variables
    console.log('About to evaluate expression:', JSON.stringify(args));
    console.log('Testing CHR$ regex on:', args);
    const chrTest = args.match(/CHR\$\s*\(\s*(\d+)\s*\)/i);
    console.log('CHR$ regex match result:', chrTest);
    
    let output = this.evaluateExpression(args);
    console.log('Expression evaluated to:', JSON.stringify(output), 'type:', typeof output);
    
    // Convert to string if needed
    output = String(output);
    
    // Add each character individually to the display
    for (let i = 0; i < output.length; i++) {
      console.log('Adding character:', JSON.stringify(output[i]), 'char code:', output.charCodeAt(i));
      this.display.addChar(output[i]);
    }
    this.display.addChar('\n'); // Add newline separately
    
    console.log('PRINT output complete');
  }  /**
   * LET command - assign variables
   */
  cmdLet(args) {
    const parts = args.split('=');
    if (parts.length !== 2) {
      throw new Error('Invalid assignment');
    }
    
    const varName = parts[0].trim();
    const value = this.evaluateExpression(parts[1].trim());
    this.variables.set(varName, value);
  }
  
  /**
   * RUN command - execute the program
   */
  cmdRun() {
    if (this.program.size === 0) {
      this.display.addChar('No program to run\n');
      return;
    }
    
    this.isRunning = true;
    this.isDirectMode = false;
    
    // Get sorted line numbers
    const lineNumbers = Array.from(this.program.keys()).sort((a, b) => a - b);
    this.programCounter = 0;
    
    this.executeProgram(lineNumbers);
  }
  
  /**
   * Execute program lines
   */
  executeProgram(lineNumbers) {
    while (this.programCounter < lineNumbers.length && this.isRunning) {
      const lineNum = lineNumbers[this.programCounter];
      const command = this.program.get(lineNum);
      
      this.executeCommand(command);
      this.programCounter++;
    }
    
    this.isRunning = false;
    this.isDirectMode = true;
  }
  
  /**
   * LIST command - show program
   */
  cmdList() {
    console.log('LIST command called');
    const lineNumbers = Array.from(this.program.keys()).sort((a, b) => a - b);
    console.log('Program has', lineNumbers.length, 'lines:', lineNumbers);
    
    if (lineNumbers.length === 0) {
      const message = 'No program lines';
      for (let i = 0; i < message.length; i++) {
        this.display.addChar(message[i]);
      }
      this.display.addChar('\n');
      return;
    }
    
    for (const lineNum of lineNumbers) {
      const command = this.program.get(lineNum);
      const line = `${lineNum} ${command}`;
      console.log('Listing line:', line);
      
      // Add each character individually
      for (let i = 0; i < line.length; i++) {
        this.display.addChar(line[i]);
      }
      this.display.addChar('\n');
    }
    console.log('LIST command complete');
  }
  
  /**
   * NEW command - clear program
   */
  cmdNew() {
    this.program.clear();
    this.variables.clear();
    this.display.addChar('Program cleared\n');
  }
  
  /**
   * CLS command - clear screen
   */
  cmdCls() {
    this.display.clearScreen();
  }
  
  /**
   * COLOR command - set text color
   */
  cmdColor(args) {
    const colorNum = parseInt(this.evaluateExpression(args));
    if (colorNum >= 0 && colorNum <= 15) {
      this.display.setTextColor(colorNum);
    }
  }
  
  /**
   * PLOT command - draw pixel
   */
  cmdPlot(args) {
    const coords = args.split(',');
    if (coords.length !== 2) {
      throw new Error('PLOT requires X,Y coordinates');
    }
    
    const x = parseInt(this.evaluateExpression(coords[0].trim()));
    const y = parseInt(this.evaluateExpression(coords[1].trim()));
    
    // Switch to graphics mode if not already
    if (!this.display.graphicsMode) {
      this.display.toggleGraphicsMode();
    }
    
    this.display.drawPixel(x, y);
  }
  
  /**
   * LINE command - draw line
   */
  cmdLine(args) {
    const coords = args.split(',');
    if (coords.length !== 4) {
      throw new Error('LINE requires X1,Y1,X2,Y2 coordinates');
    }
    
    const x1 = parseInt(this.evaluateExpression(coords[0].trim()));
    const y1 = parseInt(this.evaluateExpression(coords[1].trim()));
    const x2 = parseInt(this.evaluateExpression(coords[2].trim()));
    const y2 = parseInt(this.evaluateExpression(coords[3].trim()));
    
    // Switch to graphics mode if not already
    if (!this.display.graphicsMode) {
      this.display.toggleGraphicsMode();
    }
    
    this.display.drawLine(x1, y1, x2, y2);
  }
  
  /**
   * HTAB command - set horizontal cursor position
   */
  cmdHtab(args) {
    const col = parseInt(this.evaluateExpression(args)) - 1; // BASIC is 1-based
    this.display.moveCursorTo(col, this.display.currentRow);
  }
  
  /**
   * VTAB command - set vertical cursor position
   */
  cmdVtab(args) {
    const row = parseInt(this.evaluateExpression(args)) - 1; // BASIC is 1-based
    this.display.moveCursorTo(this.display.currentCol, row);
  }
  
  /**
   * HOME command - move cursor to top-left
   */
  cmdHome() {
    this.display.moveCursorTo(0, 0);
  }
  
  /**
   * END command - end program
   */
  cmdEnd() {
    this.isRunning = false;
    this.display.addChar('Program ended\n');
  }
  
  /**
   * Evaluate expressions (simple version)
   */
  evaluateExpression(expr) {
    expr = expr.trim();
    
    // Handle CHR$ function
    const chrMatch = expr.match(/CHR\$\s*\(\s*(\d+)\s*\)/i);
    if (chrMatch) {
      const charCode = parseInt(chrMatch[1]);
      return this.getCharacterByCode(charCode);
    }
    
    // Handle quoted strings
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    
    // Handle numbers
    if (!isNaN(expr)) {
      return parseInt(expr);
    }
    
    // Handle variables
    if (this.variables.has(expr)) {
      return this.variables.get(expr);
    }
    
    // Default to treating as string
    return expr;
  }
  
  /**
   * Get special character by character code (for CHR$ function)
   */
  getCharacterByCode(code) {
    // For codes 1-31, return the actual character code as a special marker
    // The display system will need to handle these specially
    if (code >= 1 && code <= 31) {
      return String.fromCharCode(code);
    }
    
    // For regular ASCII characters (32-126), return them normally
    if (code >= 32 && code <= 126) {
      return String.fromCharCode(code);
    }
    
    // For extended graphics characters (128+), map to control codes
    const extendedChars = {
      219: String.fromCharCode(1),   // Solid block -> CHR$(1)
      221: String.fromCharCode(2),   // Left half block -> CHR$(2)
      222: String.fromCharCode(3),   // Right half block -> CHR$(3)
      223: String.fromCharCode(4),   // Lower half block -> CHR$(4)
      220: String.fromCharCode(5)    // Upper half block -> CHR$(5)
    };
    
    if (extendedChars[code]) {
      return extendedChars[code];
    }
    
    return '?'; // Unknown character
  }
}