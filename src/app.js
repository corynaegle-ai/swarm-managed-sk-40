import { PlayerSetup, attachPlayerSetupListeners } from './components/PlayerSetup.js';
import { BiddingPhase, attachBiddingPhaseListeners } from './components/BiddingPhase.js';
import { ScoringPhase, attachScoringPhaseListeners } from './components/ScoringPhase.js';
import { ScoreBoard, attachScoreBoardListeners } from './components/ScoreBoard.js';
import { calculateRoundScore } from './utils/scoreCalculator.js';
import { validatePlayerName, isUniquePlayerName, validatePlayerCount } from './utils/gameValidator.js';

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
        return storedState ? JSON.parse(storedState) : null;
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

    const newPlayer = {
        id: `player-${Date.now()}`,
        name: name.trim(),
        totalScore: 0,
        roundScores: []
    };
    updateGameState({ players: [...gameState.players, newPlayer], globalError: null });
}

function handleRemovePlayer(playerId) {
    updateGameState({ players: gameState.players.filter(p => p.id !== playerId) });
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
    gameState.players.forEach(p => initialBids[p.id] = 0);

    updateGameState({
        phase: 'bidding',
        currentRound: 1,
        bids: initialBids, // Pre-fill bids for current round
        tricks: {},
        bonus: {},
        globalError: null
    });
}

// --- Bidding Phase Callbacks ---
function handleBidChange(playerId, bid) {
    const newBids = { ...gameState.bids, [playerId]: bid };
    updateGameState({ bids: newBids });
}

function handleBidsSubmitted() {
    // Re-validate all bids before submitting
    let allBidsValid = true;
    for (const player of gameState.players) {
        const bid = gameState.bids[player.id];
        if (typeof bid === 'undefined' || validateBid(bid, gameState.currentRound) !== null) {
            allBidsValid = false;
            break;
        }
    }

    if (!allBidsValid) {
        updateGameState({ globalError: 'Please ensure all bids are valid (0 to current round).' });
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
    updateGameState({ tricks: newTricks });
}

function handleBonusChange(playerId, bonusPoints) {
    const newBonus = { ...gameState.bonus, [playerId]: bonusPoints };
    updateGameState({ bonus: newBonus });
}

function handleScoresSubmitted() {
    const playerTricksArray = gameState.players.map(p => ({
        playerId: p.id,
        tricksTaken: gameState.tricks[p.id] !== undefined ? gameState.tricks[p.id] : 0 // Default for validation
    }));

    const totalTricksError = validateTotalTricks(playerTricksArray, gameState.currentRound);
    let inputErrorsPresent = false;

    // Check individual player inputs for validity
    for (const player of gameState.players) {
        const tricksTaken = gameState.tricks[player.id];
        const bonusPoints = gameState.bonus[player.id];

        if (typeof tricksTaken === 'undefined' || validateTricksTaken(tricksTaken, gameState.currentRound) !== null) {
            inputErrorsPresent = true;
            break;
        }
        if (typeof bonusPoints === 'undefined' || validateBonusPoints(bonusPoints) !== null) {
            inputErrorsPresent = true;
            break;
        }
    }

    if (totalTricksError || inputErrorsPresent) {
        updateGameState({ globalError: totalTricksError || 'Please ensure all tricks and bonus points are valid.' });
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
        bids: nextBids,
        tricks: {},
        bonus: {},
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
                gameState.bids
            );
            break;
        case 'scoring':
            componentHTML = ScoringPhase(
                gameState.players,
                gameState.currentRound,
                gameState.bids,
                gameState.tricks,
                gameState.bonus
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
        ${componentHTML}
    `;

    // Attach event listeners after rendering (important for dynamic content)
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
        case 'complete':
            attachScoreBoardListeners(handleRestartGame);
            break;
    }
}

// Initial render when the page loads
document.addEventListener('DOMContentLoaded', renderApp);
