#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import PrefDeckTrick from './prefDeckTrick';
import PrefDeckPile, {PrefDeckSorting} from './prefDeckPile';
import PrefDeckCard, {PrefDeckSuit, PrefDeckValue} from './prefDeckCard';
import {TPrefDeckTalon, TPrefDeckDeal} from "./prefDeck.types";

export {PrefDeckCard, PrefDeckPile, PrefDeckTrick, PrefDeckSuit, PrefDeckValue, TPrefDeckTalon, TPrefDeckDeal, PrefDeckSorting};

const _createControlDeck = (): PrefDeckCard[] => {
	const tmpCards: PrefDeckCard[] = [];
	const tmpSuits = [PrefDeckSuit.SPADE, PrefDeckSuit.DIAMOND, PrefDeckSuit.HEART, PrefDeckSuit.CLUB];
	const tmpValues = [PrefDeckValue.SEVEN, PrefDeckValue.EIGHT, PrefDeckValue.NINE, PrefDeckValue.TEN,
		PrefDeckValue.JACK, PrefDeckValue.QUEEN, PrefDeckValue.KING, PrefDeckValue.ACE];
	_.forEach(tmpSuits, (suit: PrefDeckSuit): void => {
		_.forEach(tmpValues, (value: PrefDeckValue): void => {
			tmpCards.push(new PrefDeckCard(suit, value));
		});
	});
	return tmpCards;
};

const CONTROL_DECK: PrefDeckCard[] = _createControlDeck();

const _createWeightedCuts = (): number[] => {
	let i, j;
	const tmpCuts = [2, 3];
	for (i = 0; i < 2; i++) for (j = 4; j <= 6; j++) tmpCuts.push(j);
	for (i = 0; i < 5; i++) for (j = 7; j <= 10; j++) tmpCuts.push(j);
	for (i = 0; i < 8; i++) for (j = 11; j <= 15; j++) tmpCuts.push(j);
	return _.sortBy(_.concat(tmpCuts, _.map(tmpCuts, (t: number): number => 31 - t)));
};
const WEIGHTED_CUTS: number[] = _createWeightedCuts();

const _weighted123 = (): 1 | 2 | 3 => {
	const cnt = _.random(1, 25);
	return cnt <= 20 ? 1 : (cnt <= 24 ? 2 : 3);
};

const _containsAll = (a: PrefDeckCard[], b: PrefDeckCard[]): boolean => {
	let c = true;
	_.forEach(a, (i: PrefDeckCard): boolean => c = _.includes(b, i));
	return c;
};
const _sameCards = (a: PrefDeckCard[], b: PrefDeckCard[]): boolean => (a.length === b.length && (a === b || (_containsAll(a, b) && _containsAll(b, a))));

const _isValidDeck = (cards: PrefDeckCard[]): boolean => _sameCards(cards, CONTROL_DECK);
const _randomRange = (): number[] => _.range(0, _.random(1, 3));
const _weightedRange = (): number[] => _.range(0, _weighted123());

const _shuffleHuman = (cards: PrefDeckCard[]): PrefDeckCard[] => {
	const left: PrefDeckCard[] = cards.splice(0, _.sample(WEIGHTED_CUTS));
	const right: PrefDeckCard[] = _.clone(cards);

	cards = [];
	while (!_.isEmpty(_.concat(left, right))) {
		cards = _.isEmpty(left) ? cards : cards.concat(left.splice(0, _weighted123()));
		cards = _.isEmpty(right) ? cards : cards.concat(right.splice(0, _weighted123()));
	}
	return cards;
};

const _shuffleSimple = (cards: PrefDeckCard[]): PrefDeckCard[] => {
	const left: PrefDeckCard[] = cards.splice(0, _.random(1, 9));
	const right: PrefDeckCard[] = _.clone(cards);
	let front = true;

	cards = left;
	while (!_.isEmpty(right)) {
		const cut = _.min([_.random(1, 9), _.size(right)]);
		const swap1 = right.splice(0, cut);

		cards = front ? swap1.concat(cards) : cards.concat(swap1);
		front = !front;
	}
	return cards;
};

export default class PrefDeck extends PrefDeckPile {

	public static validate(cards: PrefDeckCard[]): boolean {
		return _isValidDeck(cards);
	}

	constructor() {
		super(CONTROL_DECK);
		return this;
	}

	public restore(cards: PrefDeckCard[]): PrefDeck {
		if (!_isValidDeck(cards)) throw new Error('Deck::restore:Invalid cards to restore from: ' + _.size(cards) + ' ' + new PrefDeckPile(cards).unicode);
		this._cards = _.clone(cards);
		return this;
	}

	get cut(): PrefDeck {
		this._cards = this._cards.concat(this._cards.splice(0, _.sample(WEIGHTED_CUTS)));
		return this;
	}

	get shuffle(): PrefDeck {
		_.forEach(_randomRange(), (): PrefDeckCard[] => this._cards = _shuffleHuman(this._cards));
		_.forEach(_weightedRange(), (): PrefDeckCard[] => this._cards = _shuffleSimple(this._cards));
		return this.cut;
	}

	get valid(): boolean {
		return _isValidDeck(this.cards);
	}

	get deal(): TPrefDeckDeal {
		const hand1a = _.slice(this._cards, 0, 5);
		const hand2a = _.slice(this._cards, 5, 10);
		const hand3a = _.slice(this._cards, 10, 15);
		const talon = _.slice(this._cards, 15, 17);
		const hand1b = _.slice(this._cards, 17, 22);
		const hand2b = _.slice(this._cards, 22, 27);
		const hand3b = _.slice(this._cards, 27, 32);

		return {
			hand1: new PrefDeckPile(_.concat(hand1a, hand1b)),
			hand2: new PrefDeckPile(_.concat(hand2a, hand2b)),
			hand3: new PrefDeckPile(_.concat(hand3a, hand3b)),
			talon: {talon1: talon[0], talon2: talon[1]},
		};
	}
}
