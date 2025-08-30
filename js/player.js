// --- js/player.js ---
import { ITEMS } from './constants.js';

export let player = {};

export function resetPlayer() {
    // FIX for narrative choices: start with more credits and a useful item.
    player = {
        pos: { q: 0, r: 0 },
        credits: 150, // Start with more money
        inventory: new Map([['fuel', 1]]), // Start with one fuel cell
        storageUsed: ITEMS['fuel'].size,
        storageMax: 10
    };
}

export function buyItem(itemKey, price) {
    const item = ITEMS[itemKey];
    if (player.credits < price) {
        alert("Not enough credits!");
        return false;
    }
    if (player.storageUsed + item.size > player.storageMax) {
        alert("Not enough storage space!");
        return false;
    }
    player.credits -= price;
    player.storageUsed += item.size;
    player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) + 1);
    return true;
}

export function sellItem(itemKey, price) {
    const item = ITEMS[itemKey];
    if ((player.inventory.get(itemKey) || 0) > 0) {
        player.inventory.set(itemKey, player.inventory.get(itemKey) - 1);
        player.storageUsed -= item.size;
        player.credits += price;
        if (player.inventory.get(itemKey) === 0) {
            player.inventory.delete(itemKey);
        }
        return true;
    }
    return false;
}

export function hasContraband() {
    return (player.inventory.get('catnip') || 0) > 0 || (player.inventory.get('laser') || 0) > 0;
}
