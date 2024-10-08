import { writable } from "svelte/store";

export const selectedModel = writable("anthropic/claude-3.5-sonnet");
export const userApiKey = writable(localStorage.getItem("userApiKey") || "");
