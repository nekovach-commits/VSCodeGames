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
    // Apple II style graphics/text mode commands
    if (line.trim() === 'GR') {
      if (typeof this.display.isGraphicsMode !== 'undefined') this.display.isGraphicsMode = true;
      return;
    }
    if (line.trim() === 'TEXT') {
      if (typeof this.display.isGraphicsMode !== 'undefined') this.display.isGraphicsMode = false;
      return;
    }
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
      let exprPortion = originalLine.substring(6); // preserve original case
      let suppressNewline = false;
      // Detect trailing semicolon (not inside an open quote)
      if (/;\s*$/.test(exprPortion)) {
        const quoteCount = (exprPortion.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) { // balanced quotes => semicolon is outside
          suppressNewline = true;
          exprPortion = exprPortion.replace(/;\s*$/, '');
        }
      }
      exprPortion = exprPortion.trim();
      let value;
      if (exprPortion.startsWith('"') && exprPortion.endsWith('"')) {
        // Quoted string: print as text
        value = exprPortion.slice(1, -1);
      } else {
        // Variable or expression: print value (0 if undefined variable)
        let v = this.evaluateExpression(exprPortion);
        if (typeof v === 'undefined' || v === null || (typeof v === 'string' && v === exprPortion)) v = 0;
        value = v;
      }
      displayInterface.addText(String(value) + (suppressNewline ? '' : '\n'));
      return;
    }
    if (line === 'CLS') {
      displayInterface.clearScreen();
      return;
    }
    if (line === 'LIST') {
      const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
      for (const lineNum of sortedLines) {
        displayInterface.addText(lineNum + ' ' + this.program.get(lineNum) + '\n');
      }
      return;
    }
    if (line === 'RUN') {
      this.cmdRun();
      return;
    }
    if (line.startsWith('COLOR ')) {
      const expr = originalLine.substring(6).trim();
      let fgExpr = expr;
      let bgExpr = null;
      if (expr.includes(',')) {
        const parts = expr.split(',');
        fgExpr = parts[0].trim();
        bgExpr = parts[1].trim();
      }
      const fg = parseInt(this.evaluateExpression(fgExpr), 10);
      let ok = true;
      if (isNaN(fg) || fg < 0 || fg > 15) ok = false; else this.display.setTextColor(fg);
      if (bgExpr !== null) {
        const bg = parseInt(this.evaluateExpression(bgExpr), 10);
        if (isNaN(bg) || bg < 0 || bg > 15) ok = false; else if (this.display.setBackgroundColor) this.display.setBackgroundColor(bg);
      }
      if (!ok) {
        this.display.setTextColor(2);
        this.display.addChar('?COLOR RANGE');
        this.display.addChar('\n');
        this.display.setTextColor(14);
      }
      return;
    }
    if (line.toUpperCase().startsWith('PLOT') && (line.length === 4 || line[4] === ' ' || line[4] === '(')) {
      let expr = originalLine.substring(originalLine.toUpperCase().indexOf('PLOT') + 4).trim();
      let match = expr.match(/^\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?$/);
      if (window.console && window.console.log) window.console.log('[DEBUG] PLOT command:', expr, match);
      if (match) {
        const x = parseInt(this.evaluateExpression(match[1]), 10);
        const y = parseInt(this.evaluateExpression(match[2]), 10);
        if (window.console && window.console.log) window.console.log('[DEBUG] drawPixel:', x, y, 'color:', this.display.currentPixelColor);
        this.display.drawPixel(x, y, this.display.currentPixelColor);
        return;
      } else {
        this.display.setTextColor(2);
        this.display.addChar('?SYNTAX ERROR\n');
        this.display.setTextColor(0);
        return;
      }
    }
    if (line.toUpperCase().startsWith('LINE') && (line.length === 4 || line[4] === ' ' || line[4] === '(')) {
      let expr = originalLine.substring(originalLine.toUpperCase().indexOf('LINE') + 4).trim();
      let match = expr.match(/^\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?\s*-\s*\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?$/);
      if (window.console && window.console.log) window.console.log('[DEBUG] LINE command:', expr, match);
      if (match) {
        const x1 = parseInt(this.evaluateExpression(match[1]), 10);
        const y1 = parseInt(this.evaluateExpression(match[2]), 10);
        const x2 = parseInt(this.evaluateExpression(match[3]), 10);
        const y2 = parseInt(this.evaluateExpression(match[4]), 10);
        if (window.console && window.console.log) window.console.log('[DEBUG] drawLine:', x1, y1, x2, y2, 'color:', this.display.currentPixelColor);
        this.display.drawLine(x1, y1, x2, y2, this.display.currentPixelColor);
        return;
      } else {
        this.display.setTextColor(2);
        this.display.addChar('?SYNTAX ERROR\n');
        this.display.setTextColor(0);
        return;
      }
    }
    if (line.startsWith('RECT ')) {
      let expr = originalLine.substring(5).trim();
      let match = expr.match(/^\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?\s*-\s*\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?(?:,\s*(F))?$/i);
      if (match) {
        const x1 = parseInt(this.evaluateExpression(match[1]), 10);
        const y1 = parseInt(this.evaluateExpression(match[2]), 10);
        const x2 = parseInt(this.evaluateExpression(match[3]), 10);
        const y2 = parseInt(this.evaluateExpression(match[4]), 10);
        const filled = match[5] && match[5].toUpperCase() === 'F';
        if (filled) {
          this.display.drawRect(x1, y1, x2, y2, true, this.display.currentPixelColor);
        } else {
          this.display.drawRect(x1, y1, x2, y2, false, this.display.currentPixelColor);
        }
        return;
      } else {
        this.display.setTextColor(2);
        this.display.addChar('?SYNTAX ERROR\n');
        this.display.setTextColor(0);
        return;
      }
    }
    if (line.toUpperCase().startsWith('CIRCLE') && (line.length === 6 || line[6] === ' ' || line[6] === '(')) {
      let expr = originalLine.substring(originalLine.toUpperCase().indexOf('CIRCLE') + 6).trim();
      let match = expr.match(/^\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?\s*,\s*([\d+-]+)(?:,\s*(F))?$/i);
      if (match) {
        const cx = parseInt(this.evaluateExpression(match[1]), 10);
        const cy = parseInt(this.evaluateExpression(match[2]), 10);
        const r = parseInt(this.evaluateExpression(match[3]), 10);
        const filled = match[4] && match[4].toUpperCase() === 'F';
        this.display.drawCircle(cx, cy, r, filled);
        return;
      } else {
        this.display.setTextColor(2);
        this.display.addChar('?SYNTAX ERROR\n');
        this.display.setTextColor(0);
        return;
      }
    }
    if (line.startsWith('FILL ')) {
      const expr = originalLine.substring(5).trim();
      let match = expr.match(/^\(?\s*([\d+-]+)\s*,\s*([\d+-]+)\s*\)?$/);
      if (match) {
        const x = parseInt(this.evaluateExpression(match[1]), 10);
        const y = parseInt(this.evaluateExpression(match[2]), 10);
        this.display.floodFill(x, y);
        return;
      } else {
        this.display.setTextColor(2);
        this.display.addChar('?SYNTAX ERROR\n');
        this.display.setTextColor(0);
        return;
      }
    }
    // Catch-all for unknown/invalid commands
    this.display.setTextColor(2);
    this.display.addChar('?SYNTAX ERROR\n');
    this.display.setTextColor(0);
    return;
  }
  
  // Removed early duplicate executeProgram; see the unified implementation at the bottom of the class.
  
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
    if (this.display.clearGraphics) {
      this.display.clearGraphics();
    }
  }

  /**
   * RUN command - execute the current program
   */
  cmdRun() {
    const lineNumbers = Array.from(this.program.keys()).sort((a, b) => a - b);
    if (lineNumbers.length === 0) {
      return; // nothing to run
    }
    this.isRunning = true;
    this.isDirectMode = false;
    this.programCounter = 0;
    this.executeProgram(lineNumbers);
  }
  
  /**
   * COLOR command - set text color
   */
  cmdColor(args) {
    // Support COLOR <fg>[,<bg>] with expressions
    let fgExpr = args;
    let bgExpr = null;
    if (args.includes(',')) {
      const parts = args.split(',');
      fgExpr = parts[0].trim();
      bgExpr = parts[1].trim();
    }
    const fg = parseInt(this.evaluateExpression(fgExpr));
    if (!isNaN(fg) && fg >= 0 && fg <= 15) {
      this.display.setTextColor(fg);
    }
    if (bgExpr !== null) {
      const bg = parseInt(this.evaluateExpression(bgExpr));
      if (!isNaN(bg) && bg >= 0 && bg <= 15) {
        this.display.setBackgroundColor(bg);
      }
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
    
    // Do not auto-toggle graphics mode; text overlay remains visible
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
    
    // Do not auto-toggle graphics mode; text overlay remains visible
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
   * Execute a single BASIC statement in program mode
   * Route through the same parser as direct mode for parity
   */
  executeCommand(command) {
    if (!command) return;
    this.processLine(command);
  }

  /**
   * IF <condition> THEN <statement> [ELSE <statement>]
   * Supports numeric comparisons: =, <>, <, <=, >, >=
   */
  cmdIf(rest) {
    // Split on THEN (first occurrence)
    const thenIdx = rest.toUpperCase().indexOf(' THEN ');
    if (thenIdx === -1) {
      this.display.setTextColor(2);
      this.display.addChar('?IF THEN\n');
      this.display.setTextColor(14);
      return;
    }
    const condStr = rest.substring(0, thenIdx).trim();
    const afterThen = rest.substring(thenIdx + 6).trim();
    // Optional ELSE
    let thenStmt = afterThen;
    let elseStmt = null;
    const elseIdx = afterThen.toUpperCase().indexOf(' ELSE ');
    if (elseIdx !== -1) {
      thenStmt = afterThen.substring(0, elseIdx).trim();
      elseStmt = afterThen.substring(elseIdx + 6).trim();
    }
    const cond = this.evaluateCondition(condStr);
    const stmt = cond ? thenStmt : elseStmt;
    if (stmt) {
      // Try implicit assignment first (e.g., C=C+1)
      if (!this.tryImplicitAssignment(stmt)) {
        // Otherwise execute as a command line (allow commands like PRINT "OK")
        this.executeCommand(stmt);
      }
    }
  }

  /** Evaluate simple numeric condition */
  evaluateCondition(expr) {
    // Support operators in order of decreasing length
    const ops = ['<=', '>=', '<>', '<', '>', '='];
    const upper = expr.toUpperCase();
    for (const op of ops) {
      const idx = upper.indexOf(op);
      if (idx !== -1) {
        const left = expr.substring(0, idx).trim();
        const right = expr.substring(idx + op.length).trim();
        const l = parseInt(this.evaluateExpression(left), 10);
        const r = parseInt(this.evaluateExpression(right), 10);
        switch (op) {
          case '<=': return l <= r;
          case '>=': return l >= r;
          case '<>': return l !== r;
          case '<': return l < r;
          case '>': return l > r;
          case '=': return l === r;
        }
      }
    }
    // Fallback: non-zero means true
    const v = parseInt(this.evaluateExpression(expr), 10);
    return !!v;
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

  /** Override executeProgram to integrate FOR/NEXT and unify execution path **/
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