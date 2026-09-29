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
}