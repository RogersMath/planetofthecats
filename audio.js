// audio.js - Handles Web Audio API initialization, music playback, and sound effects.

import { generateSong } from './sonantx.js';

let audioContext;
let masterGain;

/**
 * Initializes the Web Audio API context. Must be called after a user interaction.
 * This function no longer starts the music automatically.
 */
export function initAudio() {
    if (audioContext) return; // Prevent re-initialization
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioContext.destination);

        document.getElementById('volumeSlider').addEventListener('input', e => {
            if (masterGain) {
                masterGain.gain.value = e.target.value / 100;
            }
        });
        
        console.log("Audio Context Initialized.");

    } catch (e) {
        console.error('Web Audio API initialization failed:', e);
    }
}

/**
 * Fetches, generates, and plays the looping background music.
 * CRITICAL FIX: The 'export' keyword makes this function available to other files like main.js.
 */
export async function playBackgroundMusic() {
    if (!audioContext) {
        console.error("Audio not initialized. Cannot play music.");
        return;
    }
    try {
        const response = await fetch('music.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch music.json: ${response.statusText}`);
        }
        const songData = await response.json();
        
        const buffer = await generateSong(songData, audioContext.sampleRate);
        
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        bufferSource.connect(masterGain);
        bufferSource.start();
        console.log("Background music started.");

    } catch (e) {
        console.error('Background music failed to load:', e);
    }
}

/**
 * Plays a simple procedural sound tone.
 * @param {number} freq The frequency of the tone in Hz.
 * @param {number} dur The duration of the tone in seconds.
 * @param {string} type The oscillator type ('sine', 'square', 'sawtooth', 'triangle').
 */
export function playTone(freq, dur, type) {
    if (!audioContext || !masterGain) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    // Simple ADSR-like envelope
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + dur);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + dur + 0.1);
}
