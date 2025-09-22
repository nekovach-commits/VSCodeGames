// UI and rendering logic for Spider Solitaire
console.log('UI loaded');
import { SpiderGame } from './spider.js';

const game = new SpiderGame();


function suitGlyph(s) {
  return s === "spade" ? "♠"
       : s === "heart" ? "♥"
       : s === "club" ? "♣"
       : "♦";
}

function rankLabel(r) {
  return r === 13 ? "K" : r === 12 ? "Q" : r === 11 ? "J" : r === 1 ? "A" : String(r);
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = "";

  const overlap = parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--stack-overlap'), 10);

  for (let col = 0; col < 10; col++) {
    const pile = game.piles[col];
    const pileEl = document.createElement('div');
    pileEl.className = 'pile';
    pileEl.setAttribute('role', 'group');
    pileEl.setAttribute('aria-label', `Pile ${col+1}, ${pile.length} cards`);

    // Empty pile tap target
    const emptyHit = document.createElement('div');
    emptyHit.className = 'hit';
    emptyHit.addEventListener('click', (e) => {
      console.log('Pile click', col);
      game.onPileTap(col);
      render();
    });
    emptyHit.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log('Pile touch', col);
      game.onPileTap(col);
      render();
    });
    pileEl.appendChild(emptyHit);

    let y = 0;
    for (let i = 0; i < pile.length; i++) {
      const c = pile[i];
      if (c.used) continue; // Don't render used cards
      const el = document.createElement('div');
      el.className = `card ${c.faceUp ? 'face-up' : 'face-down'} ${c.suit}`;
      el.style.transform = `translateY(${y}px)`;
      el.setAttribute('data-card-index', i);
      y += c.faceUp ? overlap : Math.max(8, overlap - 8);

      if (c.faceUp) {
        // Top-left
        const top = document.createElement('div');
        top.className = 'corner top';
        const rk = document.createElement('div'); rk.className = 'rank'; rk.textContent = rankLabel(c.rank);
        const st = document.createElement('div'); st.className = 'suit'; st.textContent = suitGlyph(c.suit);
        top.appendChild(rk); top.appendChild(st);

        // Center
        const center = document.createElement('div');
        center.className = 'center';
        center.textContent = suitGlyph(c.suit);

        // Bottom-right (rotated)
        const bot = document.createElement('div');
        bot.className = 'corner bot';
        const rk2 = document.createElement('div'); rk2.className = 'rank'; rk2.textContent = rankLabel(c.rank);
        const st2 = document.createElement('div'); st2.className = 'suit'; st2.textContent = suitGlyph(c.suit);
        bot.appendChild(rk2); bot.appendChild(st2);

        el.appendChild(top);
        el.appendChild(center);
        el.appendChild(bot);
      }

      // Tap target on card
      const hit = document.createElement('div');
      hit.className = 'hit';
      hit.addEventListener('click', (e) => {
        console.log('Card click', col, i);
        game.onCardTap(col, i);
        render();
      });
      hit.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Card touch', col, i);
        game.onCardTap(col, i);
        render();
      });
      el.appendChild(hit);

      pileEl.appendChild(el);
    }

    board.appendChild(pileEl);
  }

  // Controls
  document.getElementById('undoBtn').disabled = game.history.length === 0;
  document.getElementById('dealBtn').disabled = !canDeal();

  // Status
  document.getElementById('score').textContent = String(game.score);
  document.getElementById('moves').textContent = String(game.moves);
  document.getElementById('completed').textContent = String(game.completed);
  const hint = document.getElementById('hint');
  hint.textContent = game.selected
    ? "Tap a pile to move the selected run"
    : game.stock.length
      ? (canDeal() ? `Deals left: ${game.stock.length}` : `Fill all piles to deal (${game.stock.length} left)`)
      : (game.completed === 8 ? "You win — all suits completed!" : "No deals left.");
}

function canDeal() {
  return game.stock.length > 0 && game.piles.every(p => p.length > 0);
}


function setupUI() {
  // New Game
  document.getElementById('newBtn').addEventListener('click', () => {
    localStorage.setItem('spiderKindleSettings', JSON.stringify({
      difficulty: game.difficulty,
      mode: document.getElementById('mode').value
    }));
    game.reset();
    render();
  });


  // Undo
  document.getElementById('undoBtn').addEventListener('click', () => {
    game.undo();
    render();
  });


  // Deal
  document.getElementById('dealBtn').addEventListener('click', () => {
    game.deal();
    render();
  });

  // Difficulty
  document.getElementById('difficulty').addEventListener('change', (e) => {
    game.difficulty = parseInt(e.target.value, 10);
  });

  // Mode
  document.getElementById('mode').addEventListener('change', (e) => {
    document.body.classList.toggle('mono', e.target.value === "mono");
  });

  // Restore settings
  try {
    const saved = JSON.parse(localStorage.getItem('spiderKindleSettings') || "null");
    if (saved) {
      game.difficulty = saved.difficulty;
      document.getElementById('difficulty').value = String(saved.difficulty);
      document.getElementById('mode').value = saved.mode;
      document.body.classList.toggle('mono', saved.mode === "mono");
    }
  } catch {}

  // (No board-level event delegation needed)
}

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  render();
});
