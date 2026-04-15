import { expect } from 'chai';
import { calculateRoundScore } from '../src/utils/scoreCalculator.js';

describe('calculateRoundScore', () => {
    // Test cases for bid === tricksTaken
    it('should return +20 points per trick for a non-zero exact bid', () => {
        // Round 1, Bid 1, Tricks 1, Bonus 0 => Base 20, Total 20
        expect(calculateRoundScore(1, 1, 0, 1)).to.deep.equal({ baseScore: 20, totalRoundScore: 20 });
        // Round 5, Bid 3, Tricks 3, Bonus 0 => Base 60, Total 60
        expect(calculateRoundScore(3, 3, 0, 5)).to.deep.equal({ baseScore: 60, totalRoundScore: 60 });
    });

    it('should add bonus points for a non-zero exact bid', () => {
        // Round 1, Bid 1, Tricks 1, Bonus 50 => Base 20, Total 70
        expect(calculateRoundScore(1, 1, 50, 1)).to.deep.equal({ baseScore: 20, totalRoundScore: 70 });
        // Round 8, Bid 5, Tricks 5, Bonus 100 => Base 100, Total 200
        expect(calculateRoundScore(5, 5, 100, 8)).to.deep.equal({ baseScore: 100, totalRoundScore: 200 });
    });

    it('should return +10 * roundNumber for a zero exact bid', () => {
        // Round 1, Bid 0, Tricks 0, Bonus 0 => Base 10, Total 10
        expect(calculateRoundScore(0, 0, 0, 1)).to.deep.equal({ baseScore: 10, totalRoundScore: 10 });
        // Round 7, Bid 0, Tricks 0, Bonus 0 => Base 70, Total 70
        expect(calculateRoundScore(0, 0, 0, 7)).to.deep.equal({ baseScore: 70, totalRoundScore: 70 });
    });

    it('should add bonus points for a zero exact bid', () => {
        // Round 3, Bid 0, Tricks 0, Bonus 30 => Base 30, Total 60
        expect(calculateRoundScore(0, 0, 30, 3)).to.deep.equal({ baseScore: 30, totalRoundScore: 60 });
    });

    // Test cases for bid !== tricksTaken
    it('should return -10 * difference for a non-zero incorrect bid', () => {
        // Round 1, Bid 1, Tricks 0, Bonus 0 => Base -10, Total -10
        expect(calculateRoundScore(1, 0, 0, 1)).to.deep.equal({ baseScore: -10, totalRoundScore: -10 });
        // Round 5, Bid 3, Tricks 1, Bonus 0 => Base -20, Total -20
        expect(calculateRoundScore(3, 1, 0, 5)).to.deep.equal({ baseScore: -20, totalRoundScore: -20 });
        // Round 5, Bid 3, Tricks 4, Bonus 0 => Base -10, Total -10
        expect(calculateRoundScore(3, 4, 0, 5)).to.deep.equal({ baseScore: -10, totalRoundScore: -10 });
    });

    it('should NOT add bonus points for a non-zero incorrect bid', () => {
        // Round 1, Bid 1, Tricks 0, Bonus 50 => Base -10, Total -10
        expect(calculateRoundScore(1, 0, 50, 1)).to.deep.equal({ baseScore: -10, totalRoundScore: -10 });
    });

    it('should return -10 * roundNumber for a zero incorrect bid', () => {
        // Round 1, Bid 0, Tricks 1, Bonus 0 => Base -10, Total -10
        expect(calculateRoundScore(0, 1, 0, 1)).to.deep.equal({ baseScore: -10, totalRoundScore: -10 });
        // Round 7, Bid 0, Tricks 2, Bonus 0 => Base -70, Total -70
        expect(calculateRoundScore(0, 2, 0, 7)).to.deep.equal({ baseScore: -70, totalRoundScore: -70 });
    });

    it('should NOT add bonus points for a zero incorrect bid', () => {
        // Round 3, Bid 0, Tricks 1, Bonus 30 => Base -30, Total -30
        expect(calculateRoundScore(0, 1, 30, 3)).to.deep.equal({ baseScore: -30, totalRoundScore: -30 });
    });

    // Edge cases
    it('should handle round 10 scores correctly', () => {
        // Round 10, Bid 0, Tricks 0, Bonus 0 => Base 100, Total 100
        expect(calculateRoundScore(0, 0, 0, 10)).to.deep.equal({ baseScore: 100, totalRoundScore: 100 });
        // Round 10, Bid 0, Tricks 1, Bonus 0 => Base -100, Total -100
        expect(calculateRoundScore(0, 1, 0, 10)).to.deep.equal({ baseScore: -100, totalRoundScore: -100 });
        // Round 10, Bid 5, Tricks 5, Bonus 0 => Base 100, Total 100
        expect(calculateRoundScore(5, 5, 0, 10)).to.deep.equal({ baseScore: 100, totalRoundScore: 100 });
        // Round 10, Bid 5, Tricks 6, Bonus 0 => Base -10, Total -10
        expect(calculateRoundScore(5, 6, 0, 10)).to.deep.equal({ baseScore: -10, totalRoundScore: -10 });
    });
});
