import { calculateRoundScore } from '../utils/scoreCalculator.js';
import { validateTricksTaken, validateBonusPoints, validateTotalTricks } from '../utils/gameValidator.js';

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
 * Renders the scoring phase UI.
 * @param {Player[]} players - Current list of players.
 * @param {number} currentRound - The current round number.
 * @param {object} bidsForRound - Object mapping playerId to bid for the current round.
 * @param {object} currentTricks - Object mapping playerId to tricks taken for the current round.
 * @param {object} currentBonus - Object mapping playerId to bonus points for the current round.
 * @returns {string} HTML string for the scoring phase component.
 */
export function ScoringPhase(players, currentRound, bidsForRound, currentTricks, currentBonus) {
    const trickErrors = {};
    const bonusErrors = {};
    let allInputsValid = true;
    let tempScores = {};

    const playerTricksArray = [];

    players.forEach(player => {
        const bid = bidsForRound[player.id];
        const tricksTaken = currentTricks[player.id] !== undefined ? currentTricks[player.id] : 0; // Default to 0
        const bonusPoints = currentBonus[player.id] !== undefined ? currentBonus[player.id] : 0; // Default to 0

        playerTricksArray.push({ playerId: player.id, tricksTaken });

        const trickError = validateTricksTaken(tricksTaken, currentRound);
        if (trickError) {
            trickErrors[player.id] = trickError;
            allInputsValid = false;
        }

        const bonusError = validateBonusPoints(bonusPoints);
        if (bonusError) {
            bonusErrors[player.id] = bonusError;
            allInputsValid = false;
        }

        // Calculate temporary scores for display
        if (!trickError && !bonusError) {
            tempScores[player.id] = calculateRoundScore(bid, tricksTaken, bonusPoints, currentRound);
        }
    });

    const totalTricksError = validateTotalTricks(playerTricksArray, currentRound);
    if (totalTricksError) {
        allInputsValid = false;
    }

    return `
        <div class="scoring-phase">
            <h2 class="phase-title">Round ${currentRound}: Scoring</h2>
            <p>Enter tricks taken and bonus points for each player.</p>
            ${totalTricksError ? `<p class="error-message">${totalTricksError}</p>` : ''}

            <div class="scoring-form">
                ${players.map(player => {
                    const bid = bidsForRound[player.id];
                    const tricks = currentTricks[player.id] !== undefined ? currentTricks[player.id] : '';
                    const bonus = currentBonus[player.id] !== undefined ? currentBonus[player.id] : '';
                    const tempScore = tempScores[player.id];

                    return `
                        <div class="player-input-row">
                            <label>${player.name} (Bid: ${bid}):</label>
                            <input type="number" class="player-tricks-input" data-player-id="${player.id}"
                                   min="0" max="${currentRound}" value="${tricks}" placeholder="Tricks Taken">
                            <input type="number" class="player-bonus-input" data-player-id="${player.id}"
                                   min="0" value="${bonus}" placeholder="Bonus Points (0 if not exact)">
                            ${tempScore ? `<span>Score: ${tempScore.totalRoundScore}</span>` : ''}
                            ${trickErrors[player.id] ? `<span class="error-message">${trickErrors[player.id]}</span>` : ''}
                            ${bonusErrors[player.id] ? `<span class="error-message">${bonusErrors[player.id]}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            <button id="confirm-scores-btn" ${!allInputsValid ? 'disabled' : ''}>Confirm Scores</button>
        </div>
    `;
}

/**
 * Attaches event listeners for the ScoringPhase component.
 * @param {Function} onTricksChange - Callback when a player's tricks taken changes.
 * @param {Function} onBonusChange - Callback when a player's bonus points changes.
 * @param {Function} onScoresSubmitted - Callback when scores are confirmed.
 */
export function attachScoringPhaseListeners(onTricksChange, onBonusChange, onScoresSubmitted) {
    const scoringForm = document.querySelector('.scoring-form');
    const confirmScoresBtn = document.getElementById('confirm-scores-btn');

    if (scoringForm) {
        scoringForm.addEventListener('input', (event) => {
            const playerId = event.target.dataset.playerId;
            if (event.target.classList.contains('player-tricks-input')) {
                const tricksTaken = parseInt(event.target.value, 10);
                onTricksChange(playerId, tricksTaken);
            } else if (event.target.classList.contains('player-bonus-input')) {
                const bonusPoints = parseInt(event.target.value, 10);
                onBonusChange(playerId, bonusPoints);
            }
        });
    }

    if (confirmScoresBtn) {
        confirmScoresBtn.onclick = onScoresSubmitted;
    }
}
