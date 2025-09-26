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
    this.showStartupMessage();
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
    line = line.trim().toUpperCase();
    if (!line) return;
    
    // Check if line starts with a number (program line)
    const lineMatch = line.match(/^(\d+)\s*(.*)$/);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1]);
      const command = lineMatch[2];
      
      if (command) {
        this.program.set(lineNum, command);
      } else {
        // Delete line if no command
        this.program.delete(lineNum);
      }
      return;
    }
    
    // Direct command
    this.executeCommand(line);
  }
  
  /**
   * Execute a BASIC command
   * @param {string} command - The command to execute
   */
  executeCommand(command) {
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    
    try {
      switch (cmd) {
        case 'PRINT':
          this.cmdPrint(parts.slice(1).join(' '));
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
    if (!args) {
      this.display.addChar('\n');
      return;
    }
    
    // Handle quoted strings and variables
    let output = this.evaluateExpression(args);
    this.display.addChar(output + '\n');
  }
  
  /**
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
    const lineNumbers = Array.from(this.program.keys()).sort((a, b) => a - b);
    
    if (lineNumbers.length === 0) {
      this.display.addChar('No program lines\n');
      return;
    }
    
    for (const lineNum of lineNumbers) {
      const command = this.program.get(lineNum);
      this.display.addChar(`${lineNum} ${command}\n`);
    }
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
}