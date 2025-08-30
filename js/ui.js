// --- js/ui.js ---

import { player } from './player.js';
import { hexGrid, eventSpots, settlements } from './world.js';
import { ITEM_KEYS, ITEMS, HEX_SIZE } from './constants.js';

let canvas, ctx;

export function initUI() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
}

export function updateAllUI(game, currentSettlement) {
    // Main game UI
    document.getElementById('credits').textContent = player.credits;
    document.getElementById('storageUsed').textContent = player.storageUsed;
    document.getElementById('storageMax').textContent = player.storageMax;
    document.getElementById('movesCount').textContent = game.moves;
    document.getElementById('position').textContent = `${player.pos.q},${player.pos.r}`;

    // Town screen UI
    if (game.currentView === 'town' && currentSettlement) {
        updateTownInterface(currentSettlement, game.uiElements);
    }
}

export function updateTownInterface(settlement, uiElements) {
    document.getElementById('townUICredits').textContent = player.credits;
    // ... logic to populate market and inventory ...
}

export function render(game) {
    if (!game.running || game.currentView !== 'world' || !ctx) return;
    // ... all canvas drawing logic ...
    requestAnimationFrame(() => render(game));
}

export function showFloatingText(text, pos, color) {
    // ... logic for floating text ...
}

export function updateKeypadLabels(validActions, uiElements) {
    // ... logic for keypad labels ...
}
