/**
 * @typedef {object} RoundScoreCalculationResult
 * @property {number} baseScore
 * @property {number} totalRoundScore
 */

/**
 * Calculates the score for a single player in a given round of Skull King.
 * @param {number} bid - The number of tricks the player bid.
 * @param {number} tricksTaken - The number of tricks the player actually took.
 * @param {number} bonusPoints - Any manual bonus points awarded (e.g., from special cards).
 * @param {number} roundNumber - The current round number (1-10).
 * @returns {RoundScoreCalculationResult} An object containing the base score and total round score.
 */
export function calculateRoundScore(bid, tricksTaken, bonusPoints, roundNumber) {
    let baseScore;
    let totalRoundScore;

    if (bid === tricksTaken) {
        // Bid was met
        if (bid === 0) {
            // Zero bid success
            baseScore = 10 * roundNumber;
        } else {
            // Non-zero bid success
            baseScore = 20 * bid;
        }
        totalRoundScore = baseScore + bonusPoints;
    } else {
        // Bid was not met
        if (bid === 0) {
            // Zero bid failure
            baseScore = -10 * roundNumber;
        } else {
            // Non-zero bid failure
            const difference = Math.abs(bid - tricksTaken);
            baseScore = -10 * difference;
        }
        totalRoundScore = baseScore; // No bonus points if bid is not met
    }

    return { baseScore, totalRoundScore };
}
