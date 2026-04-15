import { PlayerSetup, attachPlayerSetupListeners } from './components/PlayerSetup.js';
import { BiddingPhase, attachBiddingPhaseListeners } from './components/BiddingPhase.js';
import { ScoringPhase, attachScoringPhaseListeners } from './components/ScoringPhase.js';
import { ScoreBoard, attachScoreBoardListeners } from './components/ScoreBoard.js';
import { calculateRoundScore } from './utils/scoreCalculator.js';
import {
    validatePlayerName,
    isUniquePlayerName,
    validatePlayerCount,
    validateBid,
    validateTricksTaken,
    validateBonusPoints,
    validateTotalTricks
} from './utils/gameValidator.js';

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
 * @typedef {object} GameState
 * @property {Player[]} players
 * @property {number} currentRound
 * @property {('setup' | 'bidding' | 'scoring' | 'complete')} phase
 * @property {Object.<string, number>} bids - Map of playerId to bid for the current round.
 * @property {Object.<string, number>} tricks - Map of playerId to tricks taken for the current round.
 * @property {Object.<string, number>} bonus - Map of playerId to bonus points for the current round.
 * @property {string|null} globalError - General error message displayed at the top of a phase.
 */

const STORAGE_KEY = 'skullKingGameState';

/** @type {GameState} */
let gameState = loadGameState() || {
    players: [],
    currentRound: 1,
    phase: 'setup', // 'setup', 'bidding', 'scoring', 'complete'
    bids: {},
    tricks: {},
    bonus: {},
    globalError: null
};

const appRoot = document.getElementById('app');

function saveGameState() {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.error("Error saving game state to session storage:", e);
    }
}

function loadGameState() {
    try {
        const storedState = sessionStorage.getItem(STORAGE_KEY);
        // Revive state, ensuring defaults are set for new properties
        const loadedState = storedState ? JSON.parse(storedState) : null;
        if (loadedState) {
            return {
                ...loadedState,
                // Ensure globalError is reset on load to prevent sticky errors from previous session
                globalError: null,
                // Ensure new properties are initialized if they weren't in old saved state
                bids: loadedState.bids || {},
                tricks: loadedState.tricks || {},
                bonus: loadedState.bonus || {}
            };
        }
        return null;
    } catch (e) {
        console.error("Error loading game state from session storage:", e);
        return null;
    }
}

function updateGameState(newPartialState) {
    gameState = { ...gameState, ...newPartialState };
    saveGameState();
    renderApp();
}

// --- Player Setup Callbacks ---
function handleAddPlayer(name) {
    const nameError = validatePlayerName(name);
    const uniqueError = isUniquePlayerName(gameState.players, name);
    if (nameError || uniqueError) {
        updateGameState({ globalError: nameError || uniqueError });
        return;
    }

    // Also check player count limit before adding
    if (gameState.players.length >= 8) {
        updateGameState({ globalError: 'Cannot add more than 8 players.' });
        return;
    }

    const newPlayer = {
        id: `player-${Date.now()}`,
        name: name.trim(),
        totalScore: 0,
        roundScores: []
    };
    updateGameState({ players: [...gameState.players, newPlayer], globalError: null });
}

function handleRemovePlayer(playerId) {
    const updatedPlayers = gameState.players.filter(p => p.id !== playerId);
    updateGameState({
        players: updatedPlayers,
        // Clear any global errors that might become irrelevant (e.g., uniqueness)
        globalError: null
    });
}

function handleUpdatePlayerName(playerId, newName) {
    const nameError = validatePlayerName(newName);
    const uniqueError = isUniquePlayerName(gameState.players, newName, playerId);
    if (nameError || uniqueError) {
        updateGameState({ globalError: nameError || uniqueError });
        return;
    }

    const updatedPlayers = gameState.players.map(p =>
        p.id === playerId ? { ...p, name: newName.trim() } : p
    );
    updateGameState({ players: updatedPlayers, globalError: null });
}

function handleStartGame() {
    const playerCountError = validatePlayerCount(gameState.players);
    const playerNamesValid = gameState.players.every(p => validatePlayerName(p.name) === null && isUniquePlayerName(gameState.players, p.name, p.id) === null);

    if (playerCountError || !playerNamesValid) {
        updateGameState({ globalError: playerCountError || 'All player names must be unique and not empty.' });
        return;
    }

    // Initialize bids for the first round
    const initialBids = {};
    gameState.players.forEach(p => initialBids[p.id] = 0); // Pre-fill with 0

    updateGameState({
        phase: 'bidding',
        currentRound: 1,
        bids: initialBids, // Pre-fill bids for current round
        tricks: {}, // Clear tricks for new phase
        bonus: {}, // Clear bonus for new phase
        globalError: null
    });
}

// --- Bidding Phase Callbacks ---
function handleBidChange(playerId, bid) {
    const newBids = { ...gameState.bids, [playerId]: bid };
    updateGameState({ bids: newBids, globalError: null }); // Clear global error on any change, re-validation will set if needed
}

function handleBidsSubmitted() {
    let currentGlobalError = null;
    let allBidsValid = true;

    for (const player of gameState.players) {
        const bid = gameState.bids[player.id];
        // Check if bid exists and is valid
        if (typeof bid === 'undefined' || validateBid(bid, gameState.currentRound) !== null) {
            allBidsValid = false;
            currentGlobalError = 'Please ensure all bids are valid (0 to current round).';
            break;
        }
    }

    if (!allBidsValid) {
        updateGameState({ globalError: currentGlobalError });
        return;
    }

    // Initialize tricks and bonus for scoring phase
    const initialTricks = {};
    const initialBonus = {};
    gameState.players.forEach(p => {
        initialTricks[p.id] = 0;
        initialBonus[p.id] = 0;
    });

    updateGameState({
        phase: 'scoring',
        tricks: initialTricks,
        bonus: initialBonus,
        globalError: null
    });
}

// --- Scoring Phase Callbacks ---
function handleTricksChange(playerId, tricksTaken) {
    const newTricks = { ...gameState.tricks, [playerId]: tricksTaken };
    updateGameState({ tricks: newTricks, globalError: null });
}

function handleBonusChange(playerId, bonusPoints) {
    const newBonus = { ...gameState.bonus, [playerId]: bonusPoints };
    updateGameState({ bonus: newBonus, globalError: null });
}

function handleScoresSubmitted() {
    let currentGlobalError = null;
    let inputErrorsPresent = false;
    const playerTricksArray = [];

    // Check individual player inputs for validity
    for (const player of gameState.players) {
        const tricksTaken = gameState.tricks[player.id];
        const bonusPoints = gameState.bonus[player.id];

        // Ensure tricksTaken and bonusPoints are numbers for validation
        const safeTricksTaken = typeof tricksTaken === 'number' ? tricksTaken : 0;
        const safeBonusPoints = typeof bonusPoints === 'number' ? bonusPoints : 0;

        playerTricksArray.push({ playerId: player.id, tricksTaken: safeTricksTaken });

        if (validateTricksTaken(safeTricksTaken, gameState.currentRound) !== null) {
            inputErrorsPresent = true;
            break;
        }
        if (validateBonusPoints(safeBonusPoints) !== null) {
            inputErrorsPresent = true;
            break;
        }
    }

    const totalTricksError = validateTotalTricks(playerTricksArray, gameState.currentRound);

    if (totalTricksError || inputErrorsPresent) {
        currentGlobalError = totalTricksError || 'Please ensure all tricks and bonus points are valid.';
        updateGameState({ globalError: currentGlobalError });
        return;
    }

    const updatedPlayers = gameState.players.map(player => {
        const bid = gameState.bids[player.id];
        const tricksTaken = gameState.tricks[player.id];
        const bonusPoints = gameState.bonus[player.id];

        const { baseScore, totalRoundScore } = calculateRoundScore(bid, tricksTaken, bonusPoints, gameState.currentRound);

        const newRoundScore = {
            round: gameState.currentRound,
            bid,
            tricksTaken,
            bonusPoints: (bid === tricksTaken) ? bonusPoints : 0, // Bonus points only if bid met
            baseScore,
            totalRoundScore
        };

        return {
            ...player,
            totalScore: player.totalScore + newRoundScore.totalRoundScore,
            roundScores: [...player.roundScores, newRoundScore]
        };
    });

    const nextRound = gameState.currentRound + 1;
    const nextPhase = nextRound > 10 ? 'complete' : 'bidding';
    const nextBids = {};
    if (nextPhase === 'bidding') {
        updatedPlayers.forEach(p => nextBids[p.id] = 0); // Initialize bids for next round
    }

    updateGameState({
        players: updatedPlayers,
        currentRound: nextRound,
        phase: nextPhase,
        bids: nextBids, // Prepare for next round
        tricks: {}, // Clear for next phase
        bonus: {}, // Clear for next phase
        globalError: null
    });
}

// --- Game Completion Callbacks ---
function handleRestartGame() {
    // Clear session storage and reset game state
    sessionStorage.removeItem(STORAGE_KEY);
    gameState = {
        players: [],
        currentRound: 1,
        phase: 'setup',
        bids: {},
        tricks: {},
        bonus: {},
        globalError: null
    };
    renderApp();
}

// --- Main Render Function ---
function renderApp() {
    let componentHTML = '';
    let scoreBoardHTML = '';

    // Render scoreboard from bidding phase onwards, unless it's the complete phase
    // where the ScoreBoard is the primary component.
    if (gameState.phase !== 'setup' && gameState.phase !== 'complete') {
        scoreBoardHTML = ScoreBoard(gameState.players, gameState.currentRound, gameState.phase);
    }

    switch (gameState.phase) {
        case 'setup':
            componentHTML = PlayerSetup(
                gameState.players,
                handleAddPlayer,
                handleRemovePlayer,
                handleUpdatePlayerName,
                handleStartGame,
                gameState.globalError
            );
            break;
        case 'bidding':
            componentHTML = BiddingPhase(
                gameState.players,
                gameState.currentRound,
                gameState.bids,
                gameState.globalError
            );
            break;
        case 'scoring':
            componentHTML = ScoringPhase(
                gameState.players,
                gameState.currentRound,
                gameState.bids,
                gameState.tricks,
                gameState.bonus,
                gameState.globalError
            );
            break;
        case 'complete':
            componentHTML = ScoreBoard(
                gameState.players,
                gameState.currentRound,
                gameState.phase
            );
            break;
        default:
            componentHTML = `<p>Unknown game phase: ${gameState.phase}</p>`;
    }

    appRoot.innerHTML = `
        <h1>Skull King Scorekeeper</h1>
        ${scoreBoardHTML}
        ${componentHTML}
    `;

    // Attach event listeners after rendering (important for dynamic content)
    // ScoreBoard listeners (for restart button) are only relevant if ScoreBoard renders the button,
    // which happens when phase is 'complete'.
    if (gameState.phase === 'complete') {
        attachScoreBoardListeners(handleRestartGame);
    }

    switch (gameState.phase) {
        case 'setup':
            attachPlayerSetupListeners(
                handleAddPlayer,
                handleRemovePlayer,
                handleUpdatePlayerName,
                handleStartGame
            );
            break;
        case 'bidding':
            attachBiddingPhaseListeners(handleBidChange, handleBidsSubmitted);
            break;
        case 'scoring':
            attachScoringPhaseListeners(handleTricksChange, handleBonusChange, handleScoresSubmitted);
            break;
        // No special listeners for 'complete' here.
    }
}

// Initial render when the page loads
document.addEventListener('DOMContentLoaded', renderApp);
