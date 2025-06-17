// stores.ts
import { writable, get } from "svelte/store";

export const selectedModel = writable("anthropic/claude-sonnet-4");
export const secondaryModels = writable([]);
export const userApiKey = writable(localStorage.getItem("userApiKey") || "");
export const isNodeResizing = writable(false);

// Processing state stores
export const isProcessing = writable(false);
export const shouldStop = writable(false);
export const activeProcesses = writable(0);

export const latestCost = writable<number | null>(null);
export const cumulativeCost = writable<number>(0);
export const generationId = writable<string | null>(null);

export function startProcessing() {
    isProcessing.set(true);
    shouldStop.set(false); // Reset stop flag when starting new process
}

export function stopProcessing() {
    shouldStop.set(true);
}

export function resetProcessing() {
    isProcessing.set(false);
    shouldStop.set(false);
    activeProcesses.set(0); // Reset counter when resetting processing
}
