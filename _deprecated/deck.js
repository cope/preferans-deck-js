#!/usr/bin/env node
"use strict";

const _ = require("lodash");
const PPN = require("./ppn");
const Cards = require("./cards");
const Card = require("./card");
const Pile = require("./pile");

let tmpCards = [];
_.forEach(_.values(PPN.all()), (ppn) => tmpCards.push(new Card(PPN.card(ppn))));
const CONTROL_DECK = Object.freeze(tmpCards);

let tmpCuts = [2, 3], i, j;
for (i = 0; i < 2; i++) for (j = 4; j <= 6; j++) tmpCuts.push(j);
for (i = 0; i < 5; i++) for (j = 7; j <= 10; j++) tmpCuts.push(j);
for (i = 0; i < 8; i++) for (j = 11; j <= 15; j++) tmpCuts.push(j);
const WEIGHTED_CUTS = Object.freeze(_.sortBy(_.concat(tmpCuts, _.map(tmpCuts, (t) => 31 - t))));

const _count123Weighted = () => {
	let cnt = _.random(1, 25);
	return cnt <= 20 ? 1 : (cnt <= 24 ? 2 : 3);
};

const _containsAll = (a, b) => {
	let c = true;
	_.forEach(a, (i) => c = _.includes(b, i));
	return c;
};
const _same = (a, b) => a.length === b.length && (a === b || (_containsAll(a, b) && _containsAll(b, a)));

const _isValidDeck = (cards) => _same(cards, CONTROL_DECK);
const _randomRange = () => _.range(0, _.random(1, 3));
const _randomRangeWeighted = () => _.range(0, _count123Weighted());

const _humanShuffle = (cards) => {
	let left = cards.splice(0, _.sample(WEIGHTED_CUTS));
	let right = _.clone(cards);

	cards = [];
	while (!_.isEmpty(_.concat(left, right))) {
		cards = _.isEmpty(left) ? cards : cards.concat(left.splice(0, _count123Weighted()));
		cards = _.isEmpty(right) ? cards : cards.concat(right.splice(0, _count123Weighted()));
	}
	return cards;
};

const _humanSimpleShuffle = (cards) => {
	let left = cards.splice(0, _.random(1, 9));
	let right = _.clone(cards);
	let toFront = true;

	cards = [].concat(left);
	while (!_.isEmpty(right)) {
		let cut = _.min([_.random(1, 9), _.size(right)]);
		let swap1 = right.splice(0, cut);

		if (toFront) cards = swap1.concat(cards);
		else cards = cards.concat(swap1);

		toFront = !toFront;
	}

	return cards;
};

class Deck extends Cards {
	constructor() {
		super(CONTROL_DECK);
		return this;
	}

	static validate(cards) {
		return _isValidDeck(cards);
	}

	isValid() {
		return _isValidDeck(this.cards);
	}

	restore(cards) {
		if (!_isValidDeck(cards)) throw new Error("Deck::restore:Invalid cards to restore from: " + cards);
		this.cards = _.clone(cards);
		return this;
	}

	cut() {
		this.cards = this.cards.concat(this.cards.splice(0, _.sample(WEIGHTED_CUTS)));
		return this;
	}

	shuffle() {
		_.forEach(_randomRange(), () => this.cards = _humanShuffle(this.cards));
		_.forEach(_randomRangeWeighted(), () => this.cards = _humanSimpleShuffle(this.cards));
		this.cut();
		return this;
	}

	deal() {
		let h1a = _.slice(this.cards, 0, 5);
		let h2a = _.slice(this.cards, 5, 10);
		let h3a = _.slice(this.cards, 10, 15);
		let t = _.slice(this.cards, 15, 17);
		let h1b = _.slice(this.cards, 17, 22);
		let h2b = _.slice(this.cards, 22, 27);
		let h3b = _.slice(this.cards, 27, 32);

		return {
			h1: new Pile(_.concat(h1a, h1b)),
			h2: new Pile(_.concat(h2a, h2b)),
			h3: new Pile(_.concat(h3a, h3b)),
			t: new Pile(t)
		};
	}
}

module.exports = Deck;
module.exports.Card = Card;
module.exports.Pile = Pile;