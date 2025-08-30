// --- js/main.js ---

import { initAudio, playBackgroundMusic, playTone, toggleMute } from '../audio.js';
import { WIN_CONDITION } from './constants.js';
import { player, resetPlayer, buyItem, sellItem, hasContraband } from './player.js';
import { generateWorld, hexGrid, eventSpots, settlements } from './world.js';
import { triggerNarrativeEvent, resolveChoice } from './narrative.js';
import { initUI, updateAllUI, render, updateKeypadLabels } from './ui.js';

// Game State
let game = {
    running: false,
    currentView: 'world',
    moves: 0,
    isAudioInitialized: false,
    validActions: [],
    currentSettlement: null,
    uiElements: {} // Store references to DOM elements
};

function startGame() {
    if (!game.isAudioInitialized) {
        initAudio();
        playBackgroundMusic();
        game.isAudioInitialized = true;
    }

    resetPlayer();
    game.running = true;
    game.currentView = 'world';
    game.moves = 0;
    
    // Hide all modals, show game container
    game.uiElements.startScreen.style.display = 'none';
    game.uiElements.winScreen.style.display = 'none';
    game.uiElements.gameOverScreen.style.display = 'none';
    game.uiElements.narrativeScreen.style.display = 'none';
    game.uiElements.townScreen.style.display = 'none';
    game.uiElements.gameContainer.style.display = 'block';

    generateWorld();
    // generateValidActions(); // This needs to be defined or moved
    updateAllUI(game, game.currentSettlement);
    render(game);
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Cache all UI elements
    game.uiElements = {
        startScreen: document.getElementById('startScreen'),
        winScreen: document.getElementById('winScreen'),
        // ... all other getElementById calls
        startGameBtn: document.getElementById('startGameBtn'),
        muteBtn: document.getElementById('muteBtn')
    };

    initUI();

    // Setup Event Listeners
    game.uiElements.startGameBtn.addEventListener('click', startGame);
    game.uiElements.muteBtn.addEventListener('click', () => {
        const isNowMuted = toggleMute();
        game.uiElements.muteBtn.textContent = isNowMuted ? '🔇' : '🔊';
    });
    // ... other event listeners
});
