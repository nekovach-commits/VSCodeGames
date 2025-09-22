// Card and Deck classes for card games

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
    this.faceUp = false;
    this.used = false;
  }
}

export class Deck {
  constructor(suits, ranks, duplicate = 2) {
    this.cards = [];
    for (let dup = 0; dup < duplicate; dup++) {
      for (const s of suits) {
        for (const r of ranks) {
          this.cards.push(new Card(r, s));
        }
      }
    }
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  deal(n) {
    return this.cards.splice(0, n);
  }
}
