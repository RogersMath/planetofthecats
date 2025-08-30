// audio.js - Handles Web Audio API initialization, music playback, and sound effects.

import { generateSong } from './sonantx.js';

let audioContext;
let masterGain;
let isMuted = false;
let lastVolume = 0.3; // Default volume

/**
 * Initializes the Web Audio API context. Must be called after a user interaction.
 */
export function initAudio() {
    if (audioContext) return; // Prevent re-initialization
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        masterGain = audioContext.createGain();
        masterGain.gain.value = lastVolume;
        masterGain.connect(audioContext.destination);

        document.getElementById('volumeSlider').addEventListener('input', e => {
            if (masterGain) {
                const newVolume = e.target.value / 100;
                lastVolume = newVolume;
                if (!isMuted) {
                    masterGain.gain.value = newVolume;
                }
            }
        });
        
        console.log("Audio Context Initialized.");

    } catch (e) {
        console.error('Web Audio API initialization failed:', e);
    }
}

/**
 * Toggles the master gain between the last set volume and zero.
 * @returns {boolean} The new mute state (true if muted, false if not).
 */
// --- FIX: The 'export' keyword was missing from this function ---
export function toggleMute() {
    if (!audioContext) return false;
    isMuted = !isMuted;
    if (isMuted) {
        masterGain.gain.setValueAtTime(0, audioContext.currentTime);
    } else {
        masterGain.gain.setValueAtTime(lastVolume, audioContext.currentTime);
    }
    return isMuted;
}

/**
 * Fetches, generates, and plays the looping background music.
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
export function playTone(freq, dur, type = 'sine') {
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
