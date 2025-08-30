// --- js/constants.js ---

export const WIN_CONDITION = {
    credits: 10000,
    moves: 1000
};

export const BOARD_RADIUS = 15;
export const HEX_SIZE = 28;

export const HEX_DIRS = [
    { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 },
    { q: 1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export const ITEMS = {
    'scrap': { name: 'Scrap Metal', basePrice: 27, size: 3, emoji: '⚙️' },
    'electronics': { name: 'Electronics', basePrice: 40, size: 1, emoji: '💻' },
    'medical': { name: 'Medical Supplies', basePrice: 55, size: 1, emoji: '💊' },
    'food': { name: 'Preserved Food', basePrice: 22, size: 2, emoji: '🥫' },
    'fuel': { name: 'Fuel Cells', basePrice: 47, size: 2, emoji: '🔋' },
    'purifier': { name: 'Water Purifier', basePrice: 175, size: 3, emoji: '💧' },
    'tuna': { name: 'Tuna Tins', basePrice: 80, size: 2, emoji: '🐟' },
    'robot': { name: 'Robot', basePrice: 275, size: 4, emoji: '🤖' },
    'catnip': { name: 'Catnip Extract', basePrice: 140, size: 1, emoji: '🌿', contraband: true },
    'laser': { name: 'Laser Pointer', basePrice: 105, size: 1, emoji: '🔴', contraband: true }
};

export const ITEM_KEYS = Object.keys(ITEMS);

export const SCENARIOS = [
    // Scenarios data remains the same...
    { title: "The Glitched Sentry", text: "You find a twitching security robot, sparking and muttering about a hidden cache.", choices: [ { text: "Salvage it", reward: { items: { 'scrap': 1, 'electronics': 1 } } }, { text: "Reboot it (-1 Fuel Cell)", cost: { items: { 'fuel': 1 } }, reward: { credits: 250 }, condition: { items: { 'fuel': 1 } } }, { text: "Leave it be", neutral: true } ]},
    { title: "The Outpost's Thirst", text: "A small settlement's water purifier is broken...", choices: [ { text: "Sell yours (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { credits: 500 }, condition: { items: { 'purifier': 1 } } }, { text: "Give it to them (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { storageMax: 2 }, condition: { items: { 'purifier': 1 } } }, { text: "Wish them luck", neutral: true } ]},
    { title: "Alley Cat Ambush", text: "A gang of menacing Alley Cats corners you...", choices: [ { text: "Distract them (-1 Laser)", cost: { items: { 'laser': 1 } }, condition: { items: { 'laser': 1 } } }, { text: "Pay them (-100c)", cost: { credits: 100 }, condition: { credits: 100 } } ]},
    // ... all other scenarios
];
