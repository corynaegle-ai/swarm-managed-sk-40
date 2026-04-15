import { validatePlayerName, isUniquePlayerName, validatePlayerCount } from '../utils/gameValidator.js';

/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} totalScore
 * @property {RoundScore[]} roundScores
 */

/**
 * Renders the player setup phase UI.
 * @param {Player[]} players - Current list of players.
 * @param {Function} onAddPlayer - Callback to add a new player.
 * @param {Function} onRemovePlayer - Callback to remove a player.
 * @param {Function} onUpdatePlayerName - Callback to update a player's name.
 * @param {Function} onStartGame - Callback to start the game.
 * @param {string|null} globalError - A global error message for the component.
 * @returns {string} HTML string for the player setup component.
 */
export function PlayerSetup(players, onAddPlayer, onRemovePlayer, onUpdatePlayerName, onStartGame, globalError) {
    const playerNameErrors = {};
    players.forEach(p => {
        playerNameErrors[p.id] = validatePlayerName(p.name) || isUniquePlayerName(players, p.name, p.id);
    });

    const canStartGame = validatePlayerCount(players) === null && Object.values(playerNameErrors).every(e => e === null);

    return `
        <div class="player-setup">
            <h2 class="phase-title">Round 1: Player Setup</h2>
            ${globalError ? `<p class="error-message">${globalError}</p>` : ''}
            <div class="form-group">
                <label for="new-player-name">Add Player Name:</label>
                <input type="text" id="new-player-name" placeholder="Enter player name">
                <button id="add-player-btn">Add Player</button>
            </div>

            <ul class="player-list">
                ${players.map(player => `
                    <li class="player-list-item" data-player-id="${player.id}">
                        <input type="text" class="player-name-input" value="${player.name}" placeholder="Player Name" data-player-id="${player.id}">
                        <button class="remove-player-btn" data-player-id="${player.id}">Remove</button>
                        ${playerNameErrors[player.id] ? `<span class="error-message">${playerNameErrors[player.id]}</span>` : ''}
                    </li>
                `).join('')}
            </ul>

            <button id="start-game-btn" ${!canStartGame ? 'disabled' : ''}>Start Game</button>
            ${validatePlayerCount(players) ? `<p class="error-message">${validatePlayerCount(players)}</p>` : ''}
        </div>
    `;
}

/**
 * Attaches event listeners for the PlayerSetup component.
 * @param {Function} onAddPlayer - Callback to add a new player.
 * @param {Function} onRemovePlayer - Callback to remove a player.
 * @param {Function} onUpdatePlayerName - Callback to update a player's name.
 * @param {Function} onStartGame - Callback to start the game.
 */
export function attachPlayerSetupListeners(onAddPlayer, onRemovePlayer, onUpdatePlayerName, onStartGame) {
    const newPlayerInput = document.getElementById('new-player-name');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const playerList = document.querySelector('.player-list');

    if (addPlayerBtn) {
        addPlayerBtn.onclick = () => {
            const name = newPlayerInput.value.trim();
            if (name) {
                onAddPlayer(name);
                newPlayerInput.value = '';
            }
        };
    }

    if (playerList) {
        playerList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-player-btn')) {
                const playerId = event.target.dataset.playerId;
                onRemovePlayer(playerId);
            }
        });

        playerList.addEventListener('change', (event) => {
            if (event.target.classList.contains('player-name-input')) {
                const playerId = event.target.dataset.playerId;
                const newName = event.target.value.trim();
                onUpdatePlayerName(playerId, newName);
            }
        });
    }

    if (startGameBtn) {
        startGameBtn.onclick = onStartGame;
    }
}
