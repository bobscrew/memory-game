// ============ МОДЕЛЬ ============

class Card {
  constructor(id, color) {
    this.id = id;
    this.color = color;
  }
}

class CardGenerator {
  static generateColorHSL(numOfCards, counter, mode) {
    const modes = {
      rainbow:     { startHue: 0,   endHue: 360, saturation: 70, lightness: 50, lightnessSpread: 0  },
      pinkMadness: { startHue: 300, endHue: 360, saturation: 80, lightness: 60, lightnessSpread: 20 },
      ocean:       { startHue: 180, endHue: 260, saturation: 65, lightness: 55, lightnessSpread: 15 }
    };

    const { startHue, endHue, saturation, lightness, lightnessSpread } = modes[mode];
    const hueStep = (endHue - startHue) / numOfCards;
    const lightStep = lightnessSpread / numOfCards;

    const hue = (startHue + hueStep * counter) % 360;
    const light = lightness - lightnessSpread / 2 + lightStep * counter;

    return `hsl(${hue}, ${saturation}%, ${light}%)`;
  }

  static createCards(numOfCards, mode) {
    const cardsArray = new Array(numOfCards);
    for (let i = 0; i < numOfCards; i++) {
      cardsArray[i] = new Card(i, this.generateColorHSL(numOfCards, i, mode));
    }
    return cardsArray;
  }

  static createPairs(cardsArray) {
    const outputArray = [];
    for (const card of cardsArray) {
      outputArray.push(new Card(card.id, card.color));
      outputArray.push(new Card(card.id, card.color));
    }
    return outputArray;
  }

  static shuffle(cardsArray) {
    for (let i = cardsArray.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      const buffer = cardsArray[i];
      cardsArray[i] = cardsArray[randomIndex];
      cardsArray[randomIndex] = buffer;
    }
    return cardsArray;
  }

  static createDeck(numOfCards, mode) {
    const base = this.createCards(numOfCards, mode);
    const paired = this.createPairs(base);
    return this.shuffle(paired);
  }
}

// ============ ИГРОВАЯ ЛОГИКА ============

class Game {
  #cards = null;
  #firstCard = null;
  #firstIndex = null;
  #secondCard = null;
  #secondIndex = null;
  #locked = false;
  #finished = false;
  #matched = 0;
  #moves = 0;
  #totalPairs = 0;
  #config = null;
  #flippedIndices = new Set();
  #matchedIndices = new Set();

  constructor(config) {
    this.#config = config;
    this.#totalPairs = config.pairs;
  }

  get cards() { return this.#cards; }
  get matched() { return this.#matched; }
  get moves() { return this.#moves; }

  start() {
    this.#cards = CardGenerator.createDeck(this.#config.pairs, this.#config.colorMode);
    this.resetTurn();
    this.#flippedIndices.clear();
    this.#matchedIndices.clear();
    this.#matched = 0;
    this.#moves = 0;
    this.#finished = false;
  }

  flip(cardIndex) {
    if (this.#finished) return { action: 'ignored', reason: 'finished' };
    if (this.#locked) return { action: 'ignored', reason: 'locked' };
    if (this.#flippedIndices.has(cardIndex)) return { action: 'ignored', reason: 'already-flipped' };
    if (this.#matchedIndices.has(cardIndex)) return { action: 'ignored', reason: 'already-matched' };

    const card = this.#cards[cardIndex];

    if (!this.#firstCard) {
      this.#firstCard = card;
      this.#firstIndex = cardIndex;
      this.#flippedIndices.add(cardIndex);
      return { action: 'first', cardIndex };
    }

    this.#secondCard = card;
    this.#secondIndex = cardIndex;
    this.#flippedIndices.add(cardIndex);
    this.#moves++;

    if (this.#firstCard.id === this.#secondCard.id) {
      this.#matchedIndices.add(this.#firstIndex);
      this.#matchedIndices.add(this.#secondIndex);
      this.#matched++;

      if (this.#matched === this.#totalPairs) {
        this.#finished = true;
      }

      const result = {
        action: 'match',
        firstIndex: this.#firstIndex,
        secondIndex: this.#secondIndex
      };
      this.resetTurn();
      return result;
    }

    const result = {
      action: 'mismatch',
      firstIndex: this.#firstIndex,
      secondIndex: this.#secondIndex
    };
    this.#locked = true;
    return result;
  }

  clearMismatch(firstIndex, secondIndex) {
    this.#flippedIndices.delete(firstIndex);
    this.#flippedIndices.delete(secondIndex);
    this.resetTurn();
  }

  isWon() {
    return this.#matched === this.#totalPairs;
  }

  resetTurn() {
    this.#firstCard = null;
    this.#secondCard = null;
    this.#firstIndex = null;
    this.#secondIndex = null;
    this.#locked = false;
  }
}

// ============ ОТРИСОВКА ============

class GameView {
  #container;
  #onCardClick;
  #cardElements = new Map();

  constructor(container, onCardClick) {
    this.#container = container;
    this.#onCardClick = onCardClick;
  }

  render(cards) {
    this.#container.replaceChildren();
    this.#cardElements.clear();

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < cards.length; i++) {
      const el = this.#createCardElement(cards[i]);
      el.addEventListener('click', () => this.#onCardClick(i));
      this.#cardElements.set(i, el);
      fragment.appendChild(el);
    }

    this.#container.appendChild(fragment);
  }

  flipCard(cardIndex) {
    const el = this.#cardElements.get(cardIndex);
    if (!el) return;
    el.classList.add('card--flipped');
  }

  unflipCard(cardIndex) {
    const el = this.#cardElements.get(cardIndex);
    if (!el) return;
    el.classList.remove('card--flipped');
  }

  markMatched(cardIndex) {
    const el = this.#cardElements.get(cardIndex);
    if (!el) return;
    el.classList.add('card--matched');
  }

  #createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.setProperty('--card-color', card.color);

    const inner = document.createElement('div');
    inner.className = 'card__inner';

    const face = document.createElement('div');
    face.className = 'card__face';

    const back = document.createElement('div');
    back.className = 'card__back';

    inner.appendChild(face);
    inner.appendChild(back);
    el.appendChild(inner);

    return el;
  }
}

// ============ МОДАЛЬНОЕ ОКНО ============

class Modal {
  #root;
  #contentEl;
  #isOpen = false;
  #onKeyDown;

  constructor() {
    this.#root = document.createElement('div');
    this.#root.className = 'modal';

    this.#contentEl = document.createElement('div');
    this.#contentEl.className = 'modal__content';
    this.#contentEl.addEventListener('click', (e) => e.stopPropagation());

    this.#root.appendChild(this.#contentEl);
    this.#root.addEventListener('click', () => this.close());

    this.#onKeyDown = (e) => {
      if (e.key === 'Escape' && this.#isOpen) this.close();
    };

    document.body.appendChild(this.#root);
  }

  open(contentNode) {
    this.#contentEl.replaceChildren(contentNode);
    this.#root.classList.add('modal--open');
    this.#isOpen = true;
    document.addEventListener('keydown', this.#onKeyDown);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.#root.classList.remove('modal--open');
    this.#isOpen = false;
    document.removeEventListener('keydown', this.#onKeyDown);
    document.body.style.overflow = '';
  }
}

// ============ ТАБЛИЦА ЛИДЕРОВ ============

class Leaderboard {
  #storageKey;
  #maxEntries = 10;

  constructor(storageKey = 'memory-leaderboard') {
    this.#storageKey = storageKey;
  }

  load() {
    const raw = localStorage.getItem(this.#storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  addResult(moves) {
    const results = this.load();
    results.push({
      moves,
      date: this.#formatDate(new Date()),
      timestamp: Date.now()
    });
    results.sort((a, b) => {
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.timestamp - b.timestamp;
    });
    const top = results.slice(0, this.#maxEntries);
    localStorage.setItem(this.#storageKey, JSON.stringify(top));
  }

  getTop() {
    return this.load();
  }

  #formatDate(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  }
}

// ============ ПРИЛОЖЕНИЕ ============

class App {
  #config = {
    pairs: 8,
    flipBackDelay: 900,
    colorMode: 'rainbow'
  };

  #game;
  #board;
  #leaderboard;
  #winModal;
  #leaderboardModal;

  #statusEl;
  #gameContainer;
  #colorSelect;
  #closeTimerId = null;

  constructor() {
    this.#buildLayout();

    this.#game = new Game(this.#config);
    this.#board = new GameView(
      this.#gameContainer,
      (cardIndex) => this.#handleCardClick(cardIndex)
    );
    this.#leaderboard = new Leaderboard('memory-leaderboard');
    this.#winModal = new Modal();
    this.#leaderboardModal = new Modal();
  }

  init() {
    this.#game.start();
    this.#board.render(this.#game.cards);
    this.updateStatus();
  }

  startNewGame() {
    if (this.#closeTimerId !== null) {
      clearTimeout(this.#closeTimerId);
      this.#closeTimerId = null;
    }

    this.#game.start();
    this.#board.render(this.#game.cards);
    this.updateStatus();
  }

  #handleCardClick(cardIndex) {
    const result = this.#game.flip(cardIndex);

    if (result.action !== 'ignored') {
      this.updateStatus();
    }

    switch (result.action) {
      case 'ignored':
        return;

      case 'first':
        this.#board.flipCard(result.cardIndex);
        return;

      case 'match':
        this.#board.flipCard(result.firstIndex);
        this.#board.flipCard(result.secondIndex);
        this.#board.markMatched(result.firstIndex);
        this.#board.markMatched(result.secondIndex);
        if (this.#game.isWon()) {
          this.#handleWin();
        }
        return;

      case 'mismatch':
        this.#board.flipCard(result.firstIndex);
        this.#board.flipCard(result.secondIndex);
        this.#closeTimerId = setTimeout(() => {
          this.#board.unflipCard(result.firstIndex);
          this.#board.unflipCard(result.secondIndex);
          this.#game.clearMismatch(result.firstIndex, result.secondIndex);
          this.#closeTimerId = null;
        }, this.#config.flipBackDelay);
        return;
    }
  }

  #handleWin() {
    setTimeout(() => {
      this.#leaderboard.addResult(this.#game.moves);
      this.#showWinModal();
    }, 400);
  }

  #showWinModal() {
    const content = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = 'Победа!';

    const info = document.createElement('p');
    info.textContent = `Ходы: ${this.#game.moves}`;

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'Новая игра';
    newGameBtn.addEventListener('click', () => {
      this.#winModal.close();
      this.startNewGame();
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => this.#winModal.close());

    content.appendChild(title);
    content.appendChild(info);
    content.appendChild(newGameBtn);
    content.appendChild(closeBtn);

    this.#winModal.open(content);
  }

  #handleShowLeaderboard() {
    const top = this.#leaderboard.getTop();

    const content = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = 'Таблица лидеров';
    content.appendChild(title);

    if (top.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Пока нет результатов';
      content.appendChild(empty);
    } else {
      const list = document.createElement('ol');
      for (const entry of top) {
        const item = document.createElement('li');
        item.textContent = `${entry.moves} ходов — ${entry.date}`;
        list.appendChild(item);
      }
      content.appendChild(list);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => this.#leaderboardModal.close());

    content.appendChild(closeBtn);
    this.#leaderboardModal.open(content);
  }

  updateStatus() {
    this.#statusEl.textContent =
      `Ходы: ${this.#game.moves} · Пары: ${this.#game.matched} / ${this.#config.pairs}`;
  }

  #buildLayout() {
    const body = document.body;

    const header = document.createElement('header');
    header.id = 'header';

    const title = document.createElement('h1');
    title.textContent = 'Memory';

    this.#colorSelect = document.createElement('select');
    this.#colorSelect.id = 'color-mode';

    const modes = [
      { value: 'rainbow', label: 'Радуга' },
      { value: 'pinkMadness', label: 'Розовый' },
      { value: 'ocean', label: 'Океан' }
    ];

    for (const mode of modes) {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      if (mode.value === this.#config.colorMode) {
        option.selected = true;
      }
      this.#colorSelect.appendChild(option);
    }

    this.#colorSelect.addEventListener('change', () => {
      this.#config.colorMode = this.#colorSelect.value;
      this.startNewGame();
    });

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'Новая игра';
    newGameBtn.addEventListener('click', () => this.startNewGame());

    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.textContent = 'Таблица лидеров';
    leaderboardBtn.addEventListener('click', () => this.#handleShowLeaderboard());

    header.appendChild(title);
    header.appendChild(this.#colorSelect);
    header.appendChild(newGameBtn);
    header.appendChild(leaderboardBtn);

    this.#statusEl = document.createElement('div');
    this.#statusEl.id = 'status';
    this.#statusEl.textContent = 'Ходы: 0 · Пары: 0 / 8';

    this.#gameContainer = document.createElement('div');
    this.#gameContainer.id = 'game';

    body.appendChild(header);
    body.appendChild(this.#statusEl);
    body.appendChild(this.#gameContainer);
  }
}

// ============ ТОЧКА ВХОДА ============

const app = new App();
app.init();