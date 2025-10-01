// Shared BASIC Processor (UMD-style global)
// Provides minimal BASIC-like command handling for both advanced and fallback paths.
// Rules:
// - PRINT only outputs quoted string literals and CHR$(n) expansions; variables alone do not print.
// - LET (or implicit A=5) handles numeric, quoted string, CHR$(n), and variable-to-variable copies.
// - Program lines: lines beginning with a number store/delete program lines.
// - RUN executes stored lines in ascending order.
// - LIST lists stored lines.
// - CLS clears screen via display interface.
// - COLOR n sets text color (0-15).
// - NEW clears program.
// Display interface contract: addText(str), clearScreen(), setTextColor(index)
(function(global){
  if(global.SharedBasicProcessor) return; // Idempotent
  const P = {
    _vars: {},
    processLine(line, program, displayInterface){
      if(!line) return;
      const originalLine = line; // preserve case for stored program
      line = line.trim();
      // Program line detection
      const numMatch = line.match(/^(\d+)\s*(.*)$/);
      if(numMatch){
        const ln = parseInt(numMatch[1],10);
        const cmd = numMatch[2];
        if(cmd){ program.set(ln, cmd); } else { program.delete(ln); }
        return;
      }
      // Direct command
      const partsUC = line.trim().toUpperCase().split(/\s+/);
      const cmd = partsUC[0];
      const parts = line.trim().split(/\s+/); // original for args
      switch(cmd){
        case 'PRINT':
          this.cmdPrint(originalLine, displayInterface); break;
        case 'LET':
          this.cmdAssignment(originalLine, displayInterface); break;
        case 'COLOR':
          this.cmdColor(parts[1], displayInterface); break;
        case 'CLS':
          displayInterface.clearScreen(); break;
        case 'LIST':
          this.cmdList(program, displayInterface); break;
        case 'RUN':
          this.cmdRun(program, displayInterface); break;
        case 'NEW':
          this.cmdNew(program, displayInterface); break;
        default:
          // Implicit assignment like A=5
            if (/^[A-Z][A-Z0-9]*\s*=/.test(partsUC.join(' '))) {
              this.cmdAssignment('LET ' + originalLine, displayInterface, true);
            } else {
              displayInterface.addText('?SYNTAX ERROR\n');
            }
      }
    },
    cmdAssignment(line, displayInterface, silent){
      line = line.replace(/^LET\s+/i,'').trim();
      const m = line.match(/^([A-Z][A-Z0-9]*)\s*=\s*(.*)$/i);
      if(!m){ if(!silent) displayInterface.addText('?SYNTAX ERROR\n'); return; }
      const name = m[1].toUpperCase();
      let expr = m[2].trim();
      if(/^".*"$/.test(expr)){
        this._vars[name] = expr.slice(1,-1);
      } else if(/^\d+$/.test(expr)){
        this._vars[name] = parseInt(expr,10);
      } else if(/^[A-Z][A-Z0-9]*$/.test(expr)){
        this._vars[name] = this._vars[expr.toUpperCase()];
      } else if(/^CHR\$\s*\(\s*\d+\s*\)$/i.test(expr)) {
        const code = parseInt(expr.match(/\d+/)[0],10);
        this._vars[name] = this.getCharacterByCode(code);
      } else {
        if(!silent) displayInterface.addText('?UNSUPPORTED EXPR\n');
        return;
      }
      if(!silent) displayInterface.addText('OK\n');
    },
    cmdPrint(originalLine, displayInterface){
      const printMatch = originalLine.match(/^(?:\s*LET\s+)?PRINT\s+(.*)$/i) || originalLine.match(/^\s*PRINT\s+(.*)$/i);
      let text = printMatch ? printMatch[1] : originalLine.substring(5).trim();
      if(!text){ displayInterface.addText('\n'); return; }
      const segments = text.split(/(?=,|;)|(?<=,|;)/);
      let out='';
      for(let seg of segments){
        seg = seg.trim();
        if(!seg) continue;
        if(seg===',' || seg===';'){ out += ' '; continue; }
        const chrMatch = seg.match(/^CHR\$\s*\(\s*(\d+)\s*\)$/i);
        if(chrMatch){ out += this.getCharacterByCode(parseInt(chrMatch[1],10)); continue; }
        if(/^".*"$/.test(seg)){ out += seg.slice(1,-1); continue; }
        if(/^[A-Z][A-Z0-9]*$/.test(seg)){ continue; } // variable suppressed
      }
      displayInterface.addText(out+'\n');
    },
    cmdColor(arg, displayInterface){
      const n = parseInt(arg,10); if(!isNaN(n) && n>=0 && n<=15){ displayInterface.setTextColor(n); } else { displayInterface.addText('?SYNTAX ERROR\n'); }
    },
    cmdList(program, displayInterface){
      const nums = Array.from(program.keys()).sort((a,b)=>a-b);
      if(nums.length===0){ displayInterface.addText('No program lines\n'); return; }
      for(const n of nums){ displayInterface.addText(n+' '+program.get(n)+'\n'); }
    },
    cmdRun(program, displayInterface){
      const nums = Array.from(program.keys()).sort((a,b)=>a-b);
      if(nums.length===0){ displayInterface.addText('No program to run\n'); return; }
      for(const n of nums){
        const line = program.get(n);
        const partsUC = line.trim().toUpperCase().split(/\s+/);
        const cmd = partsUC[0];
        if(cmd==='PRINT') this.cmdPrint('PRINT '+line.substring(5).trim(), displayInterface);
        else if(cmd==='COLOR') this.cmdColor(partsUC[1], displayInterface);
        else if(cmd==='LET' || /^[A-Z][A-Z0-9]*\s*=/.test(line.toUpperCase())) this.cmdAssignment(line, displayInterface, true);
      }
    },
    cmdNew(program, displayInterface){ program.clear(); displayInterface.addText('Program cleared\n'); },
    getCharacterByCode(code){
      if(code>=1 && code<=31) return String.fromCharCode(code);
      if(code>=32 && code<=126) return String.fromCharCode(code);
      return '?';
    }
  };
  global.SharedBasicProcessor = P;
})(window);
