import { writable } from "svelte/store";

export const selectedModel = writable("anthropic/claude-3.5-sonnet");
export const secondaryModels = writable([]);
export const userApiKey = writable(localStorage.getItem("userApiKey") || "");
export const isNodeResizing = writable(false);