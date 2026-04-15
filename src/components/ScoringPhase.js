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
 * @param {string|null} globalError - A global error message for the component.
 * @returns {string} HTML string for the scoring phase component.
 */
export function ScoringPhase(players, currentRound, bidsForRound, currentTricks, currentBonus, globalError) {
    const trickErrors = {};
    const bonusErrors = {};
    let allInputsValid = true;
    let tempScores = {};

    const playerTricksArray = [];

    // Check individual player inputs for validity and calculate temporary scores
    players.forEach(player => {
        const bid = bidsForRound[player.id];
        // Ensure inputs are always numbers for validation, default to 0 if not yet set in currentTricks/Bonus
        const tricksTaken = currentTricks[player.id] !== undefined ? currentTricks[player.id] : 0;
        const bonusPoints = currentBonus[player.id] !== undefined ? currentBonus[player.id] : 0;

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

        // Calculate temporary scores for display *only if inputs are valid for this player*
        if (!trickError && !bonusError) {
            // Pass bonus points to calculator, but it will only apply them if bid === tricksTaken
            tempScores[player.id] = calculateRoundScore(bid, tricksTaken, bonusPoints, currentRound);
        } else {
            tempScores[player.id] = { baseScore: 0, totalRoundScore: 0 }; // Show 0 or similar if invalid
        }
    });

    const totalTricksError = validateTotalTricks(playerTricksArray, currentRound);
    if (totalTricksError) {
        allInputsValid = false;
    }

    // Disable button if any individual input is invalid, total tricks is wrong, or there's a global error
    const disableConfirm = !allInputsValid || !!globalError;

    return `
        <div class="scoring-phase">
            <h2 class="phase-title">Round ${currentRound}: Scoring</h2>
            ${globalError ? `<p class="error-message">${globalError}</p>` : ''}
            <p>Enter tricks taken and bonus points for each player.</p>
            ${totalTricksError ? `<p class="error-message">${totalTricksError}</p>` : ''}

            <div class="scoring-form">
                ${players.map(player => {
                    const bid = bidsForRound[player.id];
                    // Display empty string for 0 to allow clearer user input, but internal state uses 0
                    const tricks = currentTricks[player.id] !== undefined ? currentTricks[player.id] : '';
                    const bonus = currentBonus[player.id] !== undefined ? currentBonus[player.id] : '';
                    const tempScore = tempScores[player.id];

                    return `
                        <div class="player-input-row">
                            <label>${player.name} (Bid: ${bid}):</label>
                            <input type="number" class="player-tricks-input" data-player-id="${player.id}"
                                   min="0" max="${currentRound}" value="${tricks}" placeholder="Tricks Taken">
                            <input type="number" class="player-bonus-input" data-player-id="${player.id}"
                                   min="0" value="${bonus}" placeholder="Bonus Points">
                            <span>Score: ${tempScore ? tempScore.totalRoundScore : 0}</span>
                            ${trickErrors[player.id] ? `<span class="error-message">${trickErrors[player.id]}</span>` : ''}
                            ${bonusErrors[player.id] ? `<span class="error-message">${bonusErrors[player.id]}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>

            <button id="confirm-scores-btn" ${disableConfirm ? 'disabled' : ''}>Confirm Scores</button>
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
                onTricksChange(playerId, isNaN(tricksTaken) ? 0 : tricksTaken); // Pass 0 if not a valid number
            } else if (event.target.classList.contains('player-bonus-input')) {
                const bonusPoints = parseInt(event.target.value, 10);
                onBonusChange(playerId, isNaN(bonusPoints) ? 0 : bonusPoints); // Pass 0 if not a valid number
            }
        });
    }

    if (confirmScoresBtn) {
        confirmScoresBtn.onclick = onScoresSubmitted;
    }
}
