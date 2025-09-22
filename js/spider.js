// Spider Solitaire game logic
import { Card, Deck } from './card.js';
import { shuffle, deepCloneState } from './utils.js';

export const RANKS = [13,12,11,10,9,8,7,6,5,4,3,2,1];
export const SUITS = ["spade","heart","club","diamond"];

export class SpiderGame {
  constructor(difficulty = 4) {
    this.difficulty = difficulty;
    this.reset();
  }

  reset() {
    this.piles = Array.from({ length: 10 }, () => []);
    this.stock = [];
    this.completed = 0;
    this.moves = 0;
    this.score = 500;
    this.selected = null;
    this.history = [];
    this.makeDeck();
    this.dealInitial();
  }

  makeDeck() {
    const suitSet = (this.difficulty === 1) ? ["spade"]
                  : (this.difficulty === 2) ? ["spade","heart"]
                  : SUITS.slice();
    let deck = [];
    for (let dup = 0; dup < 2; dup++) {
      for (const s of suitSet) {
        for (const r of RANKS) deck.push(new Card(r, s));
      }
      if (suitSet.length < 4) {
        const need = (4 - suitSet.length) * 13;
        for (let i = 0; i < need; i++) {
          const s = suitSet[i % suitSet.length];
          const r = RANKS[i % 13];
          deck.push(new Card(r, s));
        }
      }
    }
    shuffle(deck);
    this.deck = deck;
  }

  dealInitial() {
    let deck = this.deck.slice();
    for (let col = 0; col < 10; col++) {
      const count = (col < 4) ? 6 : 5;
      for (let i = 0; i < count; i++) this.piles[col].push(deck.shift());
      this.piles[col][this.piles[col].length - 1].faceUp = true;
    }
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 10; c++) row.push(deck.shift());
      this.stock.push(row);
    }
  }

  // --- Game logic stubs to be implemented ---

  // --- Game logic methods ---
  topMovableRunFrom(pile, idx) {
    // Selects same-suit descending run from idx to bottom.
    const run = [pile[idx]];
    for (let i = idx + 1; i < pile.length; i++) {
      const prev = pile[i - 1], cur = pile[i];
      if (!prev.faceUp || !cur.faceUp) break;
      if (cur.suit !== prev.suit) break;
      if (cur.rank !== prev.rank - 1) break;
      run.push(cur);
    }
    return run;
  }

  isCompleteSequence(pile) {
    if (pile.length < 13) return -1;
    const start = pile.length - 13;
    const suit = pile[start].suit;
    for (let i = 0; i < 13; i++) {
      const c = pile[start + i];
      if (!c.faceUp || c.suit !== suit || c.rank !== (13 - i)) return -1;
    }
    return start;
  }

  trySelect(pileIndex, cardIndex) {
    const pile = this.piles[pileIndex];
    const card = pile[cardIndex];
    if (!card || !card.faceUp) return false;
    const run = this.topMovableRunFrom(pile, cardIndex);
    if (!run.length) return false;
    this.selected = { pileIndex, cardIndex };
    return true;
  }

  moveRun(srcIndex, startIdx, dstIndex) {
    if (srcIndex === dstIndex) return false;
    const src = this.piles[srcIndex], dst = this.piles[dstIndex];
    // Only move the maximal movable run, not all cards below
    const run = this.topMovableRunFrom(src, startIdx);
    const moving = run;

    // Only consider non-used cards for destination
    const dstNonUsed = dst.filter(c => !c.used);
    // Allow move if destination is visually empty
    if (dstNonUsed.length > 0) {
      const dstTop = dstNonUsed[dstNonUsed.length - 1];
      if (!dstTop.faceUp) return false;
      const head = moving[0];
      if (dstTop.rank !== head.rank + 1) return false;
    }
    // If dstNonUsed.length === 0, allow move (empty pile)

    this.pushHistory();

    this.piles[srcIndex] = src.slice(0, startIdx);
    this.piles[dstIndex] = dst.concat(moving);
    this.flipIfExposed(this.piles[srcIndex]);

    this.moves++; this.score--;

    const at = this.isCompleteSequence(this.piles[dstIndex]);
    if (at >= 0) {
      // Instead of removing, flag as used
      for (let i = at; i < at + 13; i++) {
        if (this.piles[dstIndex][i]) this.piles[dstIndex][i].used = true;
      }
      this.completed++; this.score += 100;
      // Flip the new top card that is not used
      let newTop = this.piles[dstIndex].length - 1;
      while (newTop >= 0 && this.piles[dstIndex][newTop].used) newTop--;
      if (newTop >= 0) this.flipIfExposed([this.piles[dstIndex][newTop]]);
    }

    this.selected = null;
    return true;
  }

  flipIfExposed(pile) {
    if (!pile.length) return;
    const top = pile[pile.length - 1];
    if (!top.faceUp) top.faceUp = true;
  }

  onCardTap(pileIndex, cardIndex) {
    const pile = this.piles[pileIndex];
    const card = pile[cardIndex];
    if (!card || !card.faceUp) return;

    // Find the start of the maximal movable run if tapping the top card
    let selectIdx = cardIndex;
    if (cardIndex === pile.length - 1) {
      // Walk up to find the start of the maximal run
      for (let i = cardIndex - 1; i >= 0; i--) {
        const run = this.topMovableRunFrom(pile, i);
        if (run.length === pile.length - i) {
          selectIdx = i;
        } else {
          break;
        }
      }
    }

    if (this.selected) {
      // If tapping within same pile and below/at selection start, reselect from here
      if (this.selected.pileIndex === pileIndex && cardIndex >= this.selected.cardIndex) {
        this.trySelect(pileIndex, cardIndex);
        return;
      }
      // Try move onto this pile if tapping its top card
      if (cardIndex === pile.length - 1) {
        if (this.moveRun(this.selected.pileIndex, this.selected.cardIndex, pileIndex)) {
          return;
        }
      }
      // Otherwise, switch selection to this card (or maximal run)
      this.trySelect(pileIndex, selectIdx);
    } else {
      this.trySelect(pileIndex, selectIdx);
    }
  }

  onPileTap(pileIndex) {
    if (this.selected) {
      // Only consider non-used cards for empty check
      const nonUsed = this.piles[pileIndex].filter(c => !c.used);
      if (nonUsed.length === 0) {
        if (this.moveRun(this.selected.pileIndex, this.selected.cardIndex, pileIndex)) {
          return;
        }
      } else {
        // Find the top non-used card
        let topIdx = this.piles[pileIndex].length - 1;
        while (topIdx >= 0 && this.piles[pileIndex][topIdx].used) topIdx--;
        if (topIdx >= 0) this.onCardTap(pileIndex, topIdx);
      }
    } else {
      const nonUsed = this.piles[pileIndex].filter(c => !c.used);
      let topIdx = this.piles[pileIndex].length - 1;
      while (topIdx >= 0 && this.piles[pileIndex][topIdx].used) topIdx--;
      if (topIdx >= 0 && this.piles[pileIndex][topIdx].faceUp) {
        this.trySelect(pileIndex, topIdx);
      }
    }
  }

  pushHistory() {
    this.history.push(this.deepCloneState());
  }

  deepCloneState() {
    // Deep clone the game state for undo
    return {
      piles: this.piles.map(p => p.map(c => ({...c}))),
      stock: this.stock.map(row => row.map(c => ({...c}))),
      completed: this.completed,
      moves: this.moves,
      score: this.score,
      selected: this.selected ? {...this.selected} : null
    };
  }

  undo() {
    if (!this.history.length) return;
    const s = this.history.pop();
    this.piles = s.piles.map(p => p.map(c => ({...c})));
    this.stock = s.stock.map(row => row.map(c => ({...c})));
    this.completed = s.completed; this.moves = s.moves; this.score = s.score;
    this.selected = s.selected ? {...s.selected} : null;
  }

  deal() {
    if (!(this.stock.length > 0 && this.piles.every(p => p.length > 0))) return;
    this.pushHistory();
    const row = this.stock.shift();
    for (let i = 0; i < 10; i++) {
      const card = row[i];
      this.piles[i].push(card);
      card.faceUp = true;
    }
    this.moves++; this.score--;
    this.selected = null;
  }

  onCardTap(pileIndex, cardIndex) {
    // TODO: Implement onCardTap logic
  }

  onPileTap(pileIndex) {
    // TODO: Implement onPileTap logic
  }

  undo() {
    // TODO: Implement undo logic
  }

  deal() {
    // TODO: Implement deal logic
  }
}
