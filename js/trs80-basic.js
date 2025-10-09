/**
 * TRS-80 Applesoft-style BASIC Interpreter
 * Supports graphics commands and classic BASIC programming
 */

window.TRS80Basic = class TRS80Basic {
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
    // Preserve original for implicit assignment; create uppercase copy for keyword tests
    const rawTrimmed = line.trim();
    // First attempt implicit assignment in direct mode (A=5)
    if (!/^\d+\s/.test(rawTrimmed)) { // not a program line
      if (this.tryImplicitAssignment(rawTrimmed)) {
        return; // assignment done
      }
    }
    line = rawTrimmed.toUpperCase();
    
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
      // Evaluate the expression, supporting CHR$, variables, numbers, and quoted strings
      let output = this.evaluateExpression(text);
      output = String(output);
      displayInterface.addText(output + '\n');
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
    const originalExpr = expr;
    const upperExpr = expr.toUpperCase();
    
    // Handle CHR$ function (supports variable or arithmetic expression)
    const chrMatch = expr.match(/^(?:CHR\$)\s*\(\s*(.+)\s*\)$/i);
    if (chrMatch) {
      const innerRaw = chrMatch[1].trim();
      // Fast path: single variable or number
      if (/^[A-Z][A-Z0-9]*$/i.test(innerRaw)) {
        const varName = innerRaw.toUpperCase();
        if (this.variables.has(varName)) {
          const v = this.variables.get(varName);
          const code = parseInt(v,10);
          if (!isNaN(code)) return this.getCharacterByCode(code);
        }
      }
      // Otherwise evaluate as expression
      const evaluated = this.evaluateExpression(innerRaw === expr ? innerRaw : innerRaw);
      const code = parseInt(evaluated,10);
      if (!isNaN(code)) return this.getCharacterByCode(code);
      return '?';
    }
    // Handle quoted strings (support simple concatenation with +)
    if (expr.includes('+')) {
      const parts = expr.split('+').map(p=>p.trim());
      // If any part is quoted treat as string concat
      if (parts.some(p => /^".*"$/.test(p))) {
        return parts.map(p => {
          if (/^".*"$/.test(p)) return p.slice(1,-1);
          const up = p.toUpperCase();
          if (this.variables.has(up)) return this.variables.get(up);
          if (!isNaN(p)) return parseInt(p,10);
          return p; // fallback
        }).join('');
      }
    }
    
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    
    // Arithmetic expression support (very simple, integers only): + - * /
    if (/^[A-Z0-9\s+*\/\-]+$/.test(upperExpr)) {
      // Replace variables with values
      expr = upperExpr.replace(/[A-Z][A-Z0-9]*/g, (name) => {
        if (this.variables.has(name)) return this.variables.get(name);
        return name; // leave as-is
      });
      try {
        // Evaluate safely by restricting characters (already filtered)
        const result = Function('return (' + expr + ')')();
        if (typeof result === 'number' && !isNaN(result)) return result;
      } catch(e) { /* ignore */ }
    }
    
    // Numbers
    if (!isNaN(expr)) return parseInt(expr,10);
    // Variables
    const upperSingle = expr.toUpperCase();
    if (this.variables.has(upperSingle)) return this.variables.get(upperSingle);
    return originalExpr; // fallback raw
  }
  
  /**
   * Get special character by character code (for CHR$ function)
   */
  getCharacterByCode(code) {
    // For codes 1-255, return the actual character code
    if (code >= 1 && code <= 255) {
      return String.fromCharCode(code);
    }
    return '?'; // Unknown character
  }

  /**
   * Extended: implicit assignment support (A=5) when user types without LET
   */
  tryImplicitAssignment(line) {
    const m = line.match(/^([A-Z][A-Z0-9]*)\s*=\s*(.+)$/i);
    if (m) {
      const varName = m[1].toUpperCase();
      const valueExpr = m[2];
      const value = this.evaluateExpression(valueExpr);
      this.variables.set(varName, value);
      return true;
    }
    return false;
  }

  /** FOR/NEXT loop handling **/
  handleFor(line){
    // Syntax: FOR I = start TO end [STEP step]
    // Allow expressions with spaces until TO / STEP keywords
    const m = line.match(/^FOR\s+([A-Z][A-Z0-9]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i);
    if(!m) throw new Error('BAD FOR SYNTAX');
    const varName = m[1].toUpperCase();
    const startVal = this.evaluateExpression(m[2].trim());
    const endVal = this.evaluateExpression(m[3].trim());
    const stepVal = m[4] ? this.evaluateExpression(m[4].trim()) : 1;
    this.variables.set(varName, startVal);
    // Push loop frame
    this.forLoops.push({ varName, endVal, stepVal, lineIndex: this.programCounter });
  }

  handleNext(line){
    const m = line.match(/^NEXT\s*([A-Z][A-Z0-9]*)?$/i);
    if(!m) throw new Error('BAD NEXT SYNTAX');
    const varFilter = m[1] ? m[1].toUpperCase() : null;
    for (let i = this.forLoops.length -1; i >=0; i--) {
      const frame = this.forLoops[i];
      if (!varFilter || frame.varName === varFilter){
        // Increment variable
        const cur = this.variables.get(frame.varName) || 0;
        const next = cur + frame.stepVal;
        this.variables.set(frame.varName, next);
        if ((frame.stepVal > 0 && next <= frame.endVal) || (frame.stepVal < 0 && next >= frame.endVal)) {
          // Jump back to line after FOR line
            this.programCounter = frame.lineIndex; // will be incremented in loop executor
        } else {
          // Loop finished
          this.forLoops.splice(i,1);
        }
        return;
      }
    }
    throw new Error('NEXT WITHOUT FOR');
  }

  /** Override executeProgram to integrate FOR/NEXT **/
  executeProgram(lineNumbers) {
    while (this.programCounter < lineNumbers.length && this.isRunning) {
      const lineNum = lineNumbers[this.programCounter];
      const commandOriginal = this.program.get(lineNum);
      const command = commandOriginal.trim();
      const upper = command.toUpperCase();
      // FOR handling
      if (upper.startsWith('FOR ')) {
        this.handleFor(upper);
      } else if (upper.startsWith('NEXT')) {
        this.handleNext(upper);
      } else if (this.tryImplicitAssignment(upper)) {
        // implicit assignment done
      } else {
        this.executeCommand(command);
      }
      this.programCounter++;
    }
    this.isRunning = false;
    this.isDirectMode = true;
  }
}