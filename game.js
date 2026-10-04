class Card {
  constructor(id, color) {
    this.id = id;
    this.color = color;
  }
}

class CardGenerator {
  static randomChannelRGB() {
    const value = Math.floor(Math.random() * 256);
    return value.toString(16).padStart(2, '0');
  }

  static generateColorRGB() {
    let color = '#';
    for (let i = 0; i < 3; i++) {
      color += this.randomChannelRGB();
    }
    return color;
  }

  static createCards(numOfCards) {
    const cardsArray = new Array(numOfCards);
    for (let i = 0; i < numOfCards; i++) {
      cardsArray[i] = new Card(i, CardGenerator.generateColorRGB());
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

  // mode: зарезервировано для HSL
  static createDeck(numOfCards, mode) { 
    const base = this.createCards(numOfCards, mode);
    const paired = this.createPairs(base);
    return this.shuffle(paired);
  }
}

class Game{
  #cards = null;
  #firstCard = null;
  #firstIndex = null;
  #secondCard = null;
  #secondIndex = null;
  #locked = false;
  #matched = 0;
  #moves = 0;
  #totalPairs = 0;
  #timerId = null;
  #config = null;
  #flippedIndices = new Set();
  #matchedIndices = new Set();

  constructor(config){
    this.#config = config;
    this.#totalPairs = config.pairs;
  }

  get matched() { return this.#matched; }
  get moves() { return this.#moves; }

start() {
  this.#cancelTimer();
  this.#cards = CardGenerator.createDeck(this.#config.pairs);
  this.#resetTurn();
  this.#flippedIndices.clear();
  this.#matchedIndices.clear();
  this.#matched = 0;
  this.#moves = 0;
}

flip(cardIndex) {
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

    const result = {
      action: 'match',
      firstIndex: this.#firstIndex,
      secondIndex: this.#secondIndex
    };
    this.#resetTurn();
    return result;
  }

  const firstIndex = this.#firstIndex;
  const secondIndex = this.#secondIndex;

  this.#locked = true;
  this.#timerId = setTimeout(() => {
    this.#flippedIndices.delete(firstIndex);
    this.#flippedIndices.delete(secondIndex);
    this.#timerId = null;
    this.#resetTurn();
  }, this.#config.flipBackDelay);

  return { action: 'mismatch', firstIndex, secondIndex };
}

  isWon() {
    return this.#matched === this.#totalPairs;
  }

#resetTurn() {
  this.#firstCard = null;
  this.#secondCard = null;
  this.#firstIndex = null;
  this.#secondIndex = null;
  this.#locked = false;
}


  #cancelTimer(){
    if(this.#timerId !== null){
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  }

}

class GameView{
  container;
  onCardClick;
  cardElements;

  constructor(container, onCardClick){

  }

  render(cards){

  }

  flipCard(cardId){

  }

  inflipCard(cardId){

  }

  markMatched(cardId){

  }

  createCardElemet(card){

  }
}

class Modal{
  root;
  content;
  isOpen;

  constructor(){

  }

  open(contentNode){

  }

  close(){

  }

  setContent(){

  }
}

class Leaderboard{
  storageKey;
  maxEntries = 10;

  load(){
    localStorage.getItem();
  }

  addResult(moves){
    localStorage.setItem();
  }

  getTop(){

  }

  update(){

  }
}

class App{
  game;
  board;
  leaderBoardModal;
  
  constructor(){
    game = new Game();
    board = new GameView();
    leaderBoardModal = new Modal();
  }

  startNewGame(){

  }

  handleCardClick(cardId){
    this.game.flip();
    this.game.update();
  }

  handleModal(){

  }

  handleShowLeaderboard(){

  }

  updateStatus(){}

  init() {}
}