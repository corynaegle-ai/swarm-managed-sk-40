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
 * Renders the score board and game completion message.
 * @param {Player[]} players - Current list of players.
 * @param {number} currentRound - The current round number.
 * @param {'setup' | 'bidding' | 'scoring' | 'complete'} phase - Current game phase.
 * @returns {string} HTML string for the score board component.
 */
export function ScoreBoard(players, currentRound, phase) {
    // When game is complete, currentRound will be 11, but we only display up to round 10
    const displayRoundsCount = currentRound > 10 ? 10 : currentRound;
    const rounds = Array.from({ length: displayRoundsCount }, (_, i) => i + 1);
    const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

    const isGameComplete = phase === 'complete';

    return `
        <div class="scoreboard">
            <h2 class="phase-title">Game Scoreboard</h2>
            ${isGameComplete ? `<p class="game-complete-message">Game Over! Final Results:</p>` : `<p class="phase-title">Current Round: ${currentRound}</p>`}
            
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Total Score</th>
                        ${rounds.map(r => `<th colspan="2">Round ${r}</th>`).join('')}
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        ${rounds.map(() => `<th>B/T</th><th>Pts</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${sortedPlayers.map((player, index) => `
                        <tr>
                            <td class="player-rank">${index + 1}</td>
                            <td>${player.name}</td>
                            <td class="total-score">${player.totalScore}</td>
                            ${rounds.map(r => {
                                const roundScore = player.roundScores.find(rs => rs.round === r);
                                // For the current round being scored, its data might not be fully confirmed yet.
                                // If the game is not complete, and this is the current round number (even if in 'scoring' phase)
                                // we can highlight it.
                                const isCurrentRoundDisplay = r === currentRound && !isGameComplete;
                                if (roundScore) {
                                    return `
                                        <td class="score-history-row ${isCurrentRoundDisplay ? 'current-round-score' : ''}">
                                            ${roundScore.bid}/${roundScore.tricksTaken}
                                        </td>
                                        <td class="score-history-row ${isCurrentRoundDisplay ? 'current-round-score' : ''}">
                                            ${roundScore.totalRoundScore >= 0 ? '+' : ''}${roundScore.totalRoundScore}
                                        </td>
                                    `;
                                } else {
                                    return `<td colspan="2">-</td>`;
                                }
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${isGameComplete ? `
                <div class="final-ranking">
                    <h3>Final Rankings</h3>
                    <ol>
                        ${sortedPlayers.map((player, index) => `
                            <li>${index + 1}. <span class="player-name">${player.name}</span>: <span class="score">${player.totalScore}</span> points</li>
                        `).join('')}
                    </ol>
                    <button id="restart-game-btn">New Game</button>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Attaches event listeners for the ScoreBoard component.
 * @param {Function} onRestartGame - Callback to restart the game.
 */
export function attachScoreBoardListeners(onRestartGame) {
    const restartGameBtn = document.getElementById('restart-game-btn');
    if (restartGameBtn) {
        restartGameBtn.onclick = onRestartGame;
    }
}
