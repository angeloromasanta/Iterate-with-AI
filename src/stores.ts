// stores.ts
import { writable, get } from "svelte/store";

export const selectedModel = writable("anthropic/claude-3.5-sonnet");
export const secondaryModels = writable([]);
export const userApiKey = writable(localStorage.getItem("userApiKey") || "");
export const isNodeResizing = writable(false);

// New stores for global processing state
export const isProcessing = writable(false);
export const shouldStop = writable(false);
export const activeProcesses = writable(0);

// Modify the existing functions
export function startProcessing() {
    isProcessing.set(true);
    // Don't reset shouldStop here anymore
}

export function stopProcessing() {
    shouldStop.set(true);
    // Force reset after a short delay to ensure all processes have responded
    setTimeout(() => {
        activeProcesses.set(0);  // Force reset active processes count
        resetProcessing();       // This will now succeed since count is 0
    }, 100);
}

// Make sure resetProcessing is simple and reliable
export function resetProcessing() {
    isProcessing.set(false);
    shouldStop.set(false);
}