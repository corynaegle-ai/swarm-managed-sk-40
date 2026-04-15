import { validateBid } from '../utils/gameValidator.js';

/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} totalScore
 * @property {RoundScore[]} roundScores
 */

/**
 * @typedef {object} BidEntry
 * @property {string} playerId
 * @property {number} bid
 */

/**
 * Renders the bidding phase UI.
 * @param {Player[]} players - Current list of players.
 * @param {number} currentRound - The current round number.
 * @param {object} currentBids - Object mapping playerId to bid for the current round.
 * @param {string|null} globalError - A global error message for the component.
 * @returns {string} HTML string for the bidding phase component.
 */
export function BiddingPhase(players, currentRound, currentBids, globalError) {
    const bidErrors = {};
    let allBidsValid = true;

    // Ensure all players have an entry in currentBids, default to 0 if not set
    // Note: app.js ensures currentBids are initialized, so this loop mainly validates
    players.forEach(player => {
        const bid = currentBids[player.id]; // Should always be defined as per app.js
        const error = validateBid(bid, currentRound);
        if (error) {
            bidErrors[player.id] = error;
            allBidsValid = false;
        }
    });

    // Check if the number of bids matches the number of players
    // This helps catch cases where state might not be fully initialized or out of sync
    if (Object.keys(currentBids).length !== players.length) {
        allBidsValid = false;
    }

    // Disable button if any individual bid is invalid or if there's a global error
    const disableConfirm = !allBidsValid || !!globalError;

    return `
        <div class="bidding-phase">
            <h2 class="phase-title">Round ${currentRound}: Bidding</h2>
            ${globalError ? `<p class="error-message">${globalError}</p>` : ''}
            <p>Each player bids how many tricks they expect to take (0 to ${currentRound}).</p>

            <div class="bidding-form">
                ${players.map(player => `
                    <div class="player-input-row">
                        <label for="bid-${player.id}">${player.name}:</label>
                        <input type="number" id="bid-${player.id}" min="0" max="${currentRound}"
                               value="${currentBids[player.id]}"
                               data-player-id="${player.id}" class="player-bid-input">
                        ${bidErrors[player.id] ? `<span class="error-message">${bidErrors[player.id]}</span>` : ''}
                    </div>
                `).join('')}
            </div>

            <button id="confirm-bids-btn" ${disableConfirm ? 'disabled' : ''}>Confirm Bids</button>
        </div>
    `;
}

/**
 * Attaches event listeners for the BiddingPhase component.
 * @param {Function} onBidChange - Callback when a player's bid changes.
 * @param {Function} onBidsSubmitted - Callback when bids are confirmed.
 */
export function attachBiddingPhaseListeners(onBidChange, onBidsSubmitted) {
    const biddingForm = document.querySelector('.bidding-form');
    const confirmBidsBtn = document.getElementById('confirm-bids-btn');

    if (biddingForm) {
        biddingForm.addEventListener('input', (event) => {
            if (event.target.classList.contains('player-bid-input')) {
                const playerId = event.target.dataset.playerId;
                // Ensure bid is parsed as an integer, default to 0 if empty or invalid input
                const bid = parseInt(event.target.value, 10);
                onBidChange(playerId, isNaN(bid) ? 0 : bid); // Pass 0 if input is not a valid number
            }
        });
    }

    if (confirmBidsBtn) {
        confirmBidsBtn.onclick = onBidsSubmitted;
    }
}
