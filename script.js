document.addEventListener('DOMContentLoaded', () => {
    // Game state, Player stats, World data (mostly unchanged)
    let gameRunning = false;
    let currentView = 'world';
    let moves = 0;
    let canvas, ctx;
    const WIN_CONDITION = { credits: 10000, moves: 1000 };
    let player = { pos: { q: 0, r: 0 }, credits: 0, inventory: new Map(), storageUsed: 0, storageMax: 10 };
    const BOARD_RADIUS = 15;
    let hexGrid = new Map();
    let settlements = [];
    let roads = new Set();
    let eventSpots = [];
    let validActions = [];
    let currentSettlement = null;
    let currentScenario = null;

    // Items database (no changes)
    const ITEMS = {
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
    const ITEM_KEYS = Object.keys(ITEMS);

    // --- UPDATED SCENARIO DATABASE with a third neutral choice ---
    const SCENARIOS = [
        { title: "The Glitched Sentry", text: "You find a twitching security robot, sparking and muttering about a hidden cache.", choices: [
            { text: "Salvage it", reward: { items: { 'scrap': 1, 'electronics': 1 } } },
            { text: "Reboot it (-1 Fuel Cell)", cost: { items: { 'fuel': 1 } }, reward: { credits: 250 }, condition: { items: { 'fuel': 1 } } },
            { text: "Leave it be", neutral: true }
        ]},
        { title: "The Outpost's Thirst", text: "A small settlement's water purifier is broken. They offer a staggering price for a replacement.", choices: [
            { text: "Sell yours (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { credits: 500 }, condition: { items: { 'purifier': 1 } } },
            { text: "Give it to them (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { storageMax: 2 }, condition: { items: { 'purifier': 1 } } },
            { text: "Wish them luck", neutral: true }
        ]},
        { title: "The Whispering Plant", text: "You find a rare, glowing plant. Local legends say it brings luck to those who leave an offering.", choices: [
            { text: "Harvest it", reward: { items: { 'medical': 2 } } },
            { text: "Leave offering (-1 Tuna)", cost: { items: { 'tuna': 1 } }, reward: { credits: 150 }, condition: { items: { 'tuna': 1 } } },
            { text: "Move on", neutral: true }
        ]},
        { title: "The Collector's Item", text: "You find a perfectly preserved, pre-apocalypse can of tuna, a collector's item.", choices: [
            { text: "Sell it at the next town", reward: { credits: 350 } },
            { text: "Eat it", reward: { storageMax: 1 } },
            { text: "Leave it", neutral: true }
        ]},
        { title: "The Unmarked Crate", text: "You find a heavy, unmarked crate. Opening it will make noise.", choices: [
            { text: "Pry it open", reward: { storageMax: 3 } },
            { text: "Sell it sealed", reward: { credits: 200 } },
            { text: "Too risky, leave it", neutral: true }
        ]},
        // Negative Scenarios (some are forced choices)
        { title: "Alley Cat Ambush", text: "A gang of menacing Alley Cats corners you, demanding 'protection money'.", choices: [
            { text: "Distract them (-1 Laser)", cost: { items: { 'laser': 1 } }, condition: { items: { 'laser': 1 } } },
            { text: "Pay them (-100c)", cost: { credits: 100 }, condition: { credits: 100 } }
        ]},
        { title: "Cargo Malfunction", text: "Sparks fly from your cargo hold. A critical support has failed!", choices: [
            { text: "Jury-rig it (-1 Scrap)", cost: { items: { 'scrap': 1 } }, condition: { items: { 'scrap': 1 } } },
            { text: "Accept the loss", reward: { storageMax: -2 } },
            { text: "Ignore it for now", neutral: true }
        ]},
        { title: "Wasteland Toll", text: "A roadblock is manned by stern-looking enforcers. They demand a toll to pass.", choices: [
            { text: "Pay the toll (-50c)", cost: { credits: 50 }, condition: { credits: 50 } },
            { text: "Find another way", cost: { moves: -20 } }
        ]},
        { title: "Magnetic Storm", text: "A strange storm fries non-essential systems. You lose a random, non-critical item.", choices: [
            { text: "Assess the damage", cost: { randomItem: 1 } },
            { text: "Brace for impact", cost: { randomItem: 1 } },
            { text: "Hope for the best", cost: { randomItem: 1 } } // All choices lead to loss here
        ]},
        { title: "A Suspicious Deal", text: "A shifty trader offers you a crate of 'valuable' electronics for cheap.", choices: [
            { text: "Buy the crate (-50c)", cost: { credits: 50 }, condition: { credits: 50 } },
            { text: "Politely decline", neutral: true }
        ]}
    ];
    
    const HEX_SIZE = 28;
    const HEX_DIRS = [ { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 }, { q: 1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 } ];
    
    // UI Elements
    const startScreen = document.getElementById('startScreen'), winScreen = document.getElementById('winScreen'), gameOverScreen = document.getElementById('gameOverScreen'), townScreen = document.getElementById('townScreen'), narrativeScreen = document.getElementById('narrativeScreen'), gameContainer = document.getElementById('gameContainer');
    const keypadButtons = document.querySelectorAll('.keypad-btn');
    const startGameBtn = document.getElementById('startGameBtn'), restartGameBtn = document.getElementById('restartGameBtn'), playAgainBtn = document.getElementById('playAgainBtn'), exitTownBtn = document.getElementById('exitTownBtn'), rumorBtn = document.getElementById('rumorBtn');
    const choiceA_btn = document.getElementById('choiceA'), choiceB_btn = document.getElementById('choiceB'), choiceC_btn = document.getElementById('choiceC');

    // Utility functions (no changes)
    function hexDist(a, b) { return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2; }
    function hexInRange(center, range) {
        const results = [];
        for (let q = -range; q <= range; q++) {
            for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
                results.push({ q: center.q + q, r: center.r + r });
            }
        }
        return results;
    }
    function axialToPixel(hex) {
        if (!canvas) return { x: 0, y: 0 };
        const relQ = hex.q - player.pos.q;
        const relR = hex.r - player.pos.r;
        const x = HEX_SIZE * (3 / 2 * relQ);
        const y = HEX_SIZE * (Math.sqrt(3) / 2 * (relQ + 2 * relR));
        return { x: x + canvas.width / 2, y: y + canvas.height / 2 };
    }

    // World generation functions (no changes)
    function generateWorld() { hexGrid.clear(); settlements = []; roads.clear(); eventSpots = []; generateSettlements(); generateRoads(); createTerrain(); placeEventSpots(); }
    function generateSettlements() {
        const maxAttempts = 100;
        let attempts = 0;
        while (settlements.length < 10 && attempts < maxAttempts) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = 3 + Math.random() * (BOARD_RADIUS - 3);
            const q = Math.round(distance * Math.cos(angle));
            const r = Math.round(distance * Math.sin(angle));
            const pos = { q, r };
            if (settlements.every(s => hexDist(pos, s.pos) >= 4)) {
                settlements.push(createSettlement(pos, settlements.length));
            }
            attempts++;
        }
    }
    function createSettlement(pos, index) {
        const types = ['Mining', 'Agricultural', 'Tech Hub', 'Trading Post'];
        const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'];
        const settlement = { pos, name: `${names[index]} ${types[index % types.length]}`, type: types[index % types.length], prices: {}, desperateFor: ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)], contraband: Math.random() > 0.6 };
        ITEM_KEYS.forEach(itemKey => {
            const item = ITEMS[itemKey];
            let priceMultiplier = 0.7 + Math.random() * 0.6;
            if (settlement.type === 'Mining' && itemKey === 'food') priceMultiplier *= 1.5;
            if (settlement.type === 'Agricultural' && itemKey === 'electronics') priceMultiplier *= 1.4;
            if (settlement.type === 'Tech Hub' && itemKey === 'scrap') priceMultiplier *= 1.3;
            if (itemKey === settlement.desperateFor) priceMultiplier *= 3;
            settlement.prices[itemKey] = Math.round(item.basePrice * priceMultiplier);
        });
        return settlement;
    }
    function generateRoads() { for (let i = 0; i < settlements.length; i++) for (let j = i + 1; j < settlements.length; j++) if (hexDist(settlements[i].pos, settlements[j].pos) <= 10) createRoad(settlements[i].pos, settlements[j].pos); }
    function createRoad(start, end) {
        let current = { q: start.q, r: start.r };
        while (current.q !== end.q || current.r !== end.r) {
            roads.add(`${current.q},${current.r}`);
            if (current.q < end.q) current.q++; else if (current.q > end.q) current.q--; else if (current.r < end.r) current.r++; else if (current.r > end.r) current.r--;
        }
        roads.add(`${end.q},${end.r}`);
    }
    function createTerrain() {
        for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
            for (let r = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS); r <= Math.min(BOARD_RADIUS, -q + BOARD_RADIUS); r++) {
                const key = `${q},${r}`;
                let terrain = roads.has(key) ? 'road' : 'rough';
                const settlement = settlements.find(s => s.pos.q === q && s.pos.r === r);
                if (settlement) terrain = 'settlement';
                hexGrid.set(key, { coords: { q, r }, terrain, settlement });
            }
        }
    }
    function placeEventSpots() {
        for (let i = 0; i < 40; i++) {
            const q = Math.floor(Math.random() * (2 * BOARD_RADIUS + 1)) - BOARD_RADIUS;
            const r = Math.floor(Math.random() * (2 * BOARD_RADIUS + 1)) - BOARD_RADIUS;
            if (hexGrid.get(`${q},${r}`)?.terrain === 'rough') eventSpots.push({ q, r });
        }
    }

    // Game Logic functions (generateExpression, generateValidActions, updateKeypadLabels, handleAnswer, executeAction - all unchanged except as noted)
    function generateExpression(targetAnswer) { /* (no changes) */
        const difficulty = Math.random();
        if (difficulty < 0.4) {
            if (Math.random() > 0.5) { const a = Math.floor(Math.random() * (targetAnswer - 1)) + 1; return `${a}+${targetAnswer - a}`; } else { const a = targetAnswer + Math.floor(Math.random() * 8) + 1; return `${a}-${a - targetAnswer}`; }
        } else if (difficulty < 0.8) {
            for (let i = 2; i <= Math.sqrt(targetAnswer); i++) { if (targetAnswer % i === 0 && targetAnswer / i <= 9) return `${i}x${targetAnswer / i}`; }
            const divisor = Math.floor(Math.random() * 8) + 2; return `${targetAnswer * divisor}/${divisor}`;
        } else {
            const a = Math.floor(Math.random() * 3) + 2; const b = Math.floor(Math.random() * 3) + 1; const c = targetAnswer - (a * b);
            if (c >= 0 && c <= 9) return `${a}x${b}+${c}`; const x = Math.floor(Math.random() * (targetAnswer - 1)) + 1; return `${x}+${targetAnswer - x}`;
        }
    }
    function generateValidActions() { /* (no changes) */
        validActions = [];
        const possibleActions = [];
        HEX_DIRS.forEach(dir => {
            const newPos = { q: player.pos.q + dir.q, r: player.pos.r + dir.r };
            const hex = hexGrid.get(`${newPos.q},${newPos.r}`);
            if (hex && hexDist(newPos, { q: 0, r: 0 }) <= BOARD_RADIUS) {
                let actionType = 'move';
                if (hex.settlement) actionType = 'settlement';
                else if (eventSpots.some(s => s.q === newPos.q && s.r === newPos.r)) actionType = 'event';
                possibleActions.push({ type: actionType, pos: newPos, target: hex.settlement });
            }
        });
        const availableAnswers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        possibleActions.slice(0, 9).forEach((action, index) => { validActions.push({ answer: availableAnswers[index], expression: generateExpression(availableAnswers[index]), action }); });
        updateKeypadLabels();
    }
    function updateKeypadLabels() { /* (no changes) */
        keypadButtons.forEach(btn => {
            btn.classList.remove('valid', 'settlement', 'event');
            const answer = parseInt(btn.dataset.value);
            const validAction = validActions.find(va => va.answer === answer);
            if (validAction) {
                btn.classList.add('valid');
                const { type } = validAction.action;
                if (type === 'settlement') btn.classList.add('settlement');
                else if (type === 'event') btn.classList.add('event');
            }
        });
    }
    function handleAnswer(answer) { /* (no changes) */
        if (!gameRunning || currentView !== 'world') return;
        const validAction = validActions.find(va => va.answer === answer);
        if (!validAction) { showFloatingText('Wrong!', player.pos, '#ff4444'); return; }
        executeAction(validAction.action);
        moves++;
        updateUI();
        if (moves >= WIN_CONDITION.moves && player.credits < WIN_CONDITION.credits) { gameOver(); } else if (currentView === 'world') { generateValidActions(); }
    }
    function executeAction(action) { /* (no changes) */
        player.pos = action.pos;
        showFloatingText('Moved', action.pos, '#6bff73');
        switch (action.type) {
            case 'settlement': enterTown(action.target); break;
            case 'event': triggerNarrativeEvent(action.pos); break;
        }
    }

    // --- NARRATIVE EVENT LOGIC ---
    function triggerNarrativeEvent(pos) {
        eventSpots = eventSpots.filter(s => s.q !== pos.q || s.r !== pos.r);
        currentView = 'narrative';
        currentScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

        document.getElementById('narrativeTitle').textContent = currentScenario.title;
        document.getElementById('narrativeText').textContent = currentScenario.text;

        const choices = currentScenario.choices;
        // Choice A
        choiceA_btn.textContent = choices[0].text;
        choiceA_btn.disabled = !isChoiceAvailable(choices[0]);
        // Choice B
        choiceB_btn.textContent = choices[1].text;
        choiceB_btn.disabled = !isChoiceAvailable(choices[1]);
        // Choice C (optional)
        if (choices[2]) {
            choiceC_btn.style.display = 'block';
            choiceC_btn.textContent = choices[2].text;
            choiceC_btn.disabled = !isChoiceAvailable(choices[2]);
        } else {
            choiceC_btn.style.display = 'none';
        }
        
        narrativeScreen.style.display = 'flex';
    }

    function isChoiceAvailable(choice) { /* (no changes) */
        if (!choice.condition) return true;
        if (choice.condition.credits && player.credits < choice.condition.credits) return false;
        if (choice.condition.items) {
            for (const itemKey in choice.condition.items) {
                if ((player.inventory.get(itemKey) || 0) < choice.condition.items[itemKey]) return false;
            }
        }
        return true;
    }

    function resolveChoice(choiceIndex) {
        const choice = currentScenario.choices[choiceIndex];
        if (!choice || choice.neutral) {
            // If neutral or invalid, just close the screen
        } else {
            let outcomeText = '';
            // Process cost
            if (choice.cost) {
                if (choice.cost.credits) { player.credits -= choice.cost.credits; outcomeText += `-${choice.cost.credits}c `; }
                if (choice.cost.moves) { moves -= choice.cost.moves; outcomeText += `${choice.cost.moves > 0 ? '-' : '+'}${Math.abs(choice.cost.moves)} moves `; }
                if (choice.cost.items) {
                    for (const itemKey in choice.cost.items) {
                        const amount = choice.cost.items[itemKey];
                        player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) - amount);
                        player.storageUsed -= ITEMS[itemKey].size * amount;
                        if (player.inventory.get(itemKey) <= 0) player.inventory.delete(itemKey);
                        outcomeText += `-${amount} ${ITEMS[itemKey].name} `;
                    }
                }
                if (choice.cost.randomItem && player.inventory.size > 0) {
                    const inventoryKeys = Array.from(player.inventory.keys());
                    const itemToLose = inventoryKeys[Math.floor(Math.random() * inventoryKeys.length)];
                    player.inventory.set(itemToLose, player.inventory.get(itemToLose) - 1);
                    player.storageUsed -= ITEMS[itemToLose].size;
                    outcomeText += `Lost 1 ${ITEMS[itemToLose].name}! `;
                    if (player.inventory.get(itemToLose) === 0) player.inventory.delete(itemToLose);
                }
            }
            // Process reward
            if (choice.reward) {
                if (choice.reward.credits) { player.credits += choice.reward.credits; if (choice.reward.credits > 0) outcomeText += `+${choice.reward.credits}c `; }
                if (choice.reward.storageMax) { player.storageMax = Math.max(1, player.storageMax + choice.reward.storageMax); outcomeText += `${choice.reward.storageMax > 0 ? '+' : ''}${choice.reward.storageMax} Max Storage `; }
                if (choice.reward.items) {
                    for (const itemKey in choice.reward.items) {
                        const amount = choice.reward.items[itemKey]; const item = ITEMS[itemKey];
                        if (player.storageUsed + (item.size * amount) <= player.storageMax) {
                            player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) + amount);
                            player.storageUsed += item.size * amount;
                            outcomeText += `+${amount} ${item.name} `;
                        } else { outcomeText += 'Storage Full! '; }
                    }
                }
            }
            showFloatingText(outcomeText.trim(), player.pos, '#ffaa00');

            // Handle special random outcome for "A Suspicious Deal"
            if (currentScenario.title === "A Suspicious Deal" && !choice.neutral) {
                if (Math.random() > 0.6) { player.credits += 150; showFloatingText("+150c! A lucky find!", player.pos, '#6bff73'); } 
                else { showFloatingText("It was just junk!", player.pos, '#ff4444'); }
            }
        }
        
        // Exit narrative view
        narrativeScreen.style.display = 'none';
        currentView = 'world';
        currentScenario = null;
        updateUI();
        generateValidActions();
        render();
    }
    
    // Town, UI, Game State Functions (no changes)
    function enterTown(settlement) { currentView = 'town'; currentSettlement = settlement; gameContainer.style.display = 'none'; townScreen.style.display = 'flex'; document.getElementById('townName').textContent = settlement.name; if (hasContraband() && !settlement.contraband && Math.random() < 0.3) { performContrabandSearch(); } updateTownInterface(); }
    function exitTown() { currentView = 'world'; currentSettlement = null; townScreen.style.display = 'none'; gameContainer.style.display = 'block'; resizeCanvas(); generateValidActions(); render(); }
    function hasContraband() { return (player.inventory.get('catnip') || 0) > 0 || (player.inventory.get('laser') || 0) > 0; }
    function performContrabandSearch() { let fine = 200; ['catnip', 'laser'].forEach(key => { const amount = player.inventory.get(key) || 0; if (amount > 0) { player.storageUsed -= amount * ITEMS[key].size; player.inventory.delete(key); } }); player.credits = Math.max(0, player.credits - fine); alert(`CONTRABAND SEIZED! You were fined ${fine} credits.`); }
    function updateTownInterface() {
        const marketDiv = document.getElementById('marketPrices'); marketDiv.innerHTML = '';
        ITEM_KEYS.forEach(itemKey => {
            const item = ITEMS[itemKey]; const price = currentSettlement.prices[itemKey]; const playerAmount = player.inventory.get(itemKey) || 0; const isDesperate = itemKey === currentSettlement.desperateFor; const priceClass = isDesperate ? 'price desperate' : 'price';
            const itemDiv = document.createElement('div'); itemDiv.className = 'trade-item'; let buttonsHTML = `<button class="trade-btn buy-btn" data-item="${itemKey}" data-price="${price}">Buy</button>`; if (playerAmount > 0) { buttonsHTML += `<button class="trade-btn sell-btn" data-item="${itemKey}" data-price="${price}">Sell (${playerAmount})</button>`; }
            itemDiv.innerHTML = `<div class="item-info"><span>${item.emoji}</span><span>${item.name} ${item.contraband ? '⚠️' : ''}</span></div><div><span class="${priceClass}">${price}c</span>${buttonsHTML}</div>`; marketDiv.appendChild(itemDiv);
        });
        marketDiv.querySelectorAll('.buy-btn').forEach(b => b.addEventListener('click', e => buyItem(e.target.dataset.item, parseInt(e.target.dataset.price)))); marketDiv.querySelectorAll('.sell-btn').forEach(b => b.addEventListener('click', e => sellItem(e.target.dataset.item, parseInt(e.target.dataset.price))));
        updateInventoryDisplay(); rumorBtn.style.display = player.credits >= 50 ? 'block' : 'none';
    }
    function updateInventoryDisplay() {
        const inventoryDiv = document.getElementById('playerInventory'); inventoryDiv.innerHTML = player.inventory.size === 0 ? '<div style="grid-column: 1/-1; text-align: center; color: #888;">Empty</div>' : '';
        player.inventory.forEach((amount, itemKey) => { if (amount > 0) { const item = ITEMS[itemKey]; const itemDiv = document.createElement('div'); itemDiv.className = 'inventory-item'; itemDiv.innerHTML = `<div>${item.emoji}</div><div>${item.name}</div><div>x${amount}</div>`; inventoryDiv.appendChild(itemDiv); } });
        document.getElementById('inventorySpace').textContent = `${player.storageUsed}/${player.storageMax}`;
    }
    function sellItem(itemKey, price) { const item = ITEMS[itemKey]; player.inventory.set(itemKey, player.inventory.get(itemKey) - 1); player.storageUsed -= item.size; player.credits += price; if (player.inventory.get(itemKey) === 0) player.inventory.delete(itemKey); updateTownInterface(); updateUI(); if (player.credits >= WIN_CONDITION.credits) winGame(); }
    function buyItem(itemKey, price) { const item = ITEMS[itemKey]; if (player.credits < price) return alert("Not enough credits!"); if (player.storageUsed + item.size > player.storageMax) return alert("Not enough storage space!"); player.credits -= price; player.storageUsed += item.size; player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) + 1); updateTownInterface(); updateUI(); }
    function buyRumor() { if (player.credits < 50) return; player.credits -= 50; const rumorInfo = document.getElementById('rumorInfo'); if (Math.random() < 0.5) { const settlement = settlements[Math.floor(Math.random() * settlements.length)]; const item = ITEMS[settlement.desperateFor]; rumorInfo.textContent = `Rumor: ${settlement.name} is desperate for ${item.name}!`; } else { rumorInfo.textContent = "The trader shrugs. 'Nothing interesting happening lately.'"; } updateUI(); }
    function showFloatingText(text, pos, color) { const pixel = axialToPixel(pos); const element = document.createElement('div'); element.className = 'floating-text'; element.textContent = text; element.style.left = `${pixel.x}px`; element.style.top = `${pixel.y}px`; element.style.color = color || '#ffffff'; gameContainer.appendChild(element); setTimeout(() => element.remove(), 1500); }
    function drawHex(center, size, fillColor, strokeColor, lineWidth) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const angle = i * Math.PI / 3; const x = center.x + size * Math.cos(angle); const y = center.y + size * Math.sin(angle); if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } } ctx.closePath(); if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); } ctx.strokeStyle = strokeColor || '#6bff73'; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
    function drawExpression(expression, center, color) { ctx.font = `${HEX_SIZE * 0.5}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 3; ctx.fillText(expression, center.x, center.y); ctx.shadowBlur = 0; }
   function render() {
    if (!gameRunning || currentView !== 'world' || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexInRange(player.pos, 6).forEach(hexPos => {
        const hex = hexGrid.get(`${hexPos.q},${hexPos.r}`); if (!hex) return;
        const pixel = axialToPixel(hexPos); const isPlayer = hexPos.q === player.pos.q && hexPos.r === player.pos.r;
        let fillColor = '#2a2a1a', strokeColor = '#6bff73', lineWidth = 1;
        if (hex.terrain === 'road') fillColor = '#4a4a2a'; else if (hex.terrain === 'settlement') { fillColor = '#2a4a4a'; strokeColor = '#ffaa00'; lineWidth = 2; }
        if (isPlayer) { strokeColor = '#ff6b73'; lineWidth = 3; ctx.shadowColor = '#ff6b73'; ctx.shadowBlur = 10; }
        drawHex(pixel, HEX_SIZE - 1, fillColor, strokeColor, lineWidth); ctx.shadowBlur = 0;
        const validAction = validActions.find(va => va.action.pos.q === hexPos.q && va.action.pos.r === hexPos.r);
        if (!isPlayer && validAction) drawExpression(validAction.expression, pixel, '#ffffff');
        ctx.font = `${HEX_SIZE * 0.8}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (hex.terrain === 'settlement') { ctx.fillStyle = '#ffaa00'; ctx.fillText('🏘️', pixel.x, pixel.y); }
        else if (eventSpots.some(s => s.q === hexPos.q && s.r === hexPos.r)) { ctx.fillStyle = '#aa00ff'; ctx.fillText('❓', pixel.x, pixel.y); }
        if (isPlayer) { ctx.font = `${HEX_SIZE * 1.0}px monospace`; ctx.fillStyle = '#ffffff'; ctx.fillText('🐈‍⬛', pixel.x, pixel.y); }
    });
    requestAnimationFrame(render);
}
    
// --- UPDATED to handle town screen credits ---
function updateUI() {
    // Main game UI
    document.getElementById('credits').textContent = player.credits;
    document.getElementById('storageUsed').textContent = player.storageUsed;
    document.getElementById('storageMax').textContent = player.storageMax;
    document.getElementById('movesCount').textContent = moves;
    document.getElementById('position').textContent = `${player.pos.q},${player.pos.r}`;

    // Town screen UI (if visible)
    const townCreditsEl = document.getElementById('townUICredits');
    if (townCreditsEl) {
        townCreditsEl.textContent = player.credits;
    }
}

function winGame() { /* (no changes) */
    gameRunning = false;
    document.getElementById('winCredits').textContent = player.credits;
    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'flex';
}
function gameOver() { /* (no changes) */
    gameRunning = false;
    document.getElementById('finalCredits').textContent = player.credits;
    gameContainer.style.display = 'none';
    winScreen.style.display = 'none';
    gameOverScreen.style.display = 'flex';
}

function startGame() { /* (no changes) */
    player = { pos: { q: 0, r: 0 }, credits: 50, inventory: new Map(), storageUsed: 0, storageMax: 10 }; moves = 0; gameRunning = true; currentView = 'world';
    startScreen.style.display = 'none'; winScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; townScreen.style.display = 'none'; narrativeScreen.style.display = 'none'; gameContainer.style.display = 'block';
    resizeCanvas(); generateWorld(); generateValidActions(); updateUI(); render();
}

// ... (Rest of the file, including Event Listeners and initGame, remains the same) ...

// --- EVENT LISTENERS ---
keypadButtons.forEach(button => button.addEventListener('click', () => handleAnswer(parseInt(button.dataset.value))));
startGameBtn.addEventListener('click', startGame); restartGameBtn.addEventListener('click', startGame); playAgainBtn.addEventListener('click', startGame); exitTownBtn.addEventListener('click', exitTown); rumorBtn.addEventListener('click', buyRumor);
choiceA_btn.addEventListener('click', () => resolveChoice(0)); choiceB_btn.addEventListener('click', () => resolveChoice(1)); choiceC_btn.addEventListener('click', () => resolveChoice(2));
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key >= '1' && e.key <= '9' && currentView === 'world') handleAnswer(parseInt(e.key));
    else if (e.key === 'Escape' && currentView === 'town') exitTown();
});

function resizeCanvas() { if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; } }
function initGame() { canvas = document.getElementById('gameCanvas'); if (canvas) { ctx = canvas.getContext('2d'); window.addEventListener('resize', resizeCanvas); } }
initGame();
});
