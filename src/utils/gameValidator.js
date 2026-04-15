/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} totalScore
 * @property {RoundScore[]} roundScores
 */

/**
 * @typedef {object} RoundScore
 * @property {number} round
 * @property {number} bid
 * @property {number} tricksTaken
 * @property {number} bonusPoints
 * @property {number} baseScore
 * @property {number} totalRoundScore
 */

/**
 * Validates a player's name.
 * @param {string} name - The player's name.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validatePlayerName(name) {
    if (!name || name.trim() === '') {
        return 'Player name cannot be empty.';
    }
    return null;
}

/**
 * Validates if a player name is unique among existing players.
 * @param {Player[]} players - Array of existing players.
 * @param {string} name - The name to check for uniqueness.
 * @param {string} [excludeId] - Optional ID of a player to exclude from the uniqueness check (for edits).
 * @returns {string|null} Error message if not unique, null otherwise.
 */
export function isUniquePlayerName(players, name, excludeId = '') {
    if (players.some(p => p.id !== excludeId && p.name.toLowerCase() === name.trim().toLowerCase())) {
        return 'Player name must be unique.';
    }
    return null;
}

/**
 * Validates the number of players.
 * @param {Player[]} players - Array of players.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validatePlayerCount(players) {
    if (players.length < 2 || players.length > 8) {
        return 'A game requires between 2 and 8 players.';
    }
    return null;
}

/**
 * Validates a bid for a given round.
 * @param {number} bid - The bid value.
 * @param {number} currentRound - The current round number.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validateBid(bid, currentRound) {
    if (isNaN(bid) || bid < 0 || bid > currentRound) {
        return `Bid must be between 0 and ${currentRound}.`;
    }
    return null;
}

/**
 * Validates tricks taken for a given round.
 * @param {number} tricksTaken - The tricks taken value.
 * @param {number} currentRound - The current round number.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validateTricksTaken(tricksTaken, currentRound) {
    if (isNaN(tricksTaken) || tricksTaken < 0 || tricksTaken > currentRound) {
        return `Tricks taken must be between 0 and ${currentRound}.`;
    }
    return null;
}

/**
 * Validates bonus points.
 * @param {number} bonusPoints - The bonus points value.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validateBonusPoints(bonusPoints) {
    if (isNaN(bonusPoints) || bonusPoints < 0) {
        return 'Bonus points cannot be negative.';
    }
    return null;
}

/**
 * Validates that the total number of tricks taken by all players equals the current round number.
 * @param {{playerId: string, tricksTaken: number}[]} playerTricks - Array of objects with player ID and tricks taken.
 * @param {number} currentRound - The current round number.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
export function validateTotalTricks(playerTricks, currentRound) {
    const totalTricks = playerTricks.reduce((sum, entry) => sum + entry.tricksTaken, 0);
    if (totalTricks !== currentRound) {
        return `Total tricks taken (${totalTricks}) must equal the round number (${currentRound}).`;
    }
    return null;
}
