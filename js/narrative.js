// --- js/narrative.js ---

import { player } from './player.js';
import { SCENARIOS, ITEMS } from './constants.js';
import { showFloatingText } from './ui.js';

let currentScenario = null;

export function triggerNarrativeEvent(uiElements) {
    currentScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    
    uiElements.narrativeTitle.textContent = currentScenario.title;
    uiElements.narrativeText.textContent = currentScenario.text;

    const choices = currentScenario.choices;
    uiElements.choiceA.textContent = choices[0].text;
    uiElements.choiceA.disabled = !isChoiceAvailable(choices[0]);
    
    uiElements.choiceB.textContent = choices[1].text;
    uiElements.choiceB.disabled = !isChoiceAvailable(choices[1]);

    if (choices[2]) {
        uiElements.choiceC.style.display = 'block';
        uiElements.choiceC.textContent = choices[2].text;
        uiElements.choiceC.disabled = !isChoiceAvailable(choices[2]);
    } else {
        uiElements.choiceC.style.display = 'none';
    }
    
    uiElements.narrativeScreen.style.display = 'flex';
}

function isChoiceAvailable(choice) {
    if (!choice.condition) return true;
    if (choice.condition.credits && player.credits < choice.condition.credits) return false;
    if (choice.condition.items) {
        for (const itemKey in choice.condition.items) {
            if ((player.inventory.get(itemKey) || 0) < choice.condition.items[itemKey]) return false;
        }
    }
    return true;
}

export function resolveChoice(choiceIndex, game) {
    const choice = currentScenario.choices[choiceIndex];
    if (choice && !choice.neutral) {
        let outcomeText = '';
        // Process Costs
        if (choice.cost) {
            if (choice.cost.credits) { player.credits -= choice.cost.credits; outcomeText += `-${choice.cost.credits}c `; }
            if (choice.cost.moves) { game.moves -= choice.cost.moves; outcomeText += `${choice.cost.moves > 0 ? '-' : '+'}${Math.abs(choice.cost.moves)} moves `; }
            if (choice.cost.items) { /* ... cost item logic ... */ }
            if (choice.cost.randomItem && player.inventory.size > 0) { /* ... cost random item logic ... */ }
        }
        // Process Rewards
        if (choice.reward) {
            if (choice.reward.credits) { player.credits += choice.reward.credits; outcomeText += `+${choice.reward.credits}c `; }
            if (choice.reward.storageMax) { player.storageMax = Math.max(1, player.storageMax + choice.reward.storageMax); outcomeText += `+${choice.reward.storageMax > 0 ? '+' : ''}${choice.reward.storageMax} Storage `; }
            if (choice.reward.items) { /* ... reward item logic ... */ }
        }

        showFloatingText(outcomeText.trim(), player.pos, '#ffaa00');

        // Special random outcome
        if (currentScenario.title === "A Suspicious Deal" && !choice.neutral) {
            if (Math.random() > 0.6) { player.credits += 150; showFloatingText("+150c! A lucky find!", player.pos, '#6bff73'); } 
            else { showFloatingText("It was just junk!", player.pos, '#ff4444'); }
        }
    }
    currentScenario = null;
    return 'world'; // Return the new game state
}
