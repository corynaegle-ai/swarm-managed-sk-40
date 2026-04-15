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
 * @returns {string} HTML string for the bidding phase component.
 */
export function BiddingPhase(players, currentRound, currentBids) {
    const bidErrors = {};
    let allBidsValid = true;

    // Ensure all players have an entry in currentBids, default to 0 if not set
    players.forEach(player => {
        if (typeof currentBids[player.id] === 'undefined') {
            currentBids[player.id] = 0; // Initialize bid to 0 if not present
        }
        const error = validateBid(currentBids[player.id], currentRound);
        if (error) {
            bidErrors[player.id] = error;
            allBidsValid = false;
        }
    });

    if (Object.keys(currentBids).length !== players.length) {
        allBidsValid = false; // Not all players have bids recorded (initial state)
    }

    return `
        <div class="bidding-phase">
            <h2 class="phase-title">Round ${currentRound}: Bidding</h2>
            <p>Each player bids how many tricks they expect to take (0 to ${currentRound}).</p>

            <div class="bidding-form">
                ${players.map(player => `
                    <div class="player-input-row">
                        <label for="bid-${player.id}">${player.name}:</label>
                        <input type="number" id="bid-${player.id}" min="0" max="${currentRound}"
                               value="${currentBids[player.id] !== undefined ? currentBids[player.id] : ''}"
                               data-player-id="${player.id}" class="player-bid-input">
                        ${bidErrors[player.id] ? `<span class="error-message">${bidErrors[player.id]}</span>` : ''}
                    </div>
                `).join('')}
            </div>

            <button id="confirm-bids-btn" ${!allBidsValid ? 'disabled' : ''}>Confirm Bids</button>
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
                const bid = parseInt(event.target.value, 10);
                onBidChange(playerId, bid);
            }
        });
    }

    if (confirmBidsBtn) {
        confirmBidsBtn.onclick = onBidsSubmitted;
    }
}
