import { derived, writable } from 'svelte/store';
import { npcPersonas } from '../data/npcPersonas.js';

// Store for chat messages used across chat components
export const messages = writable([]);

export const personaOptions = npcPersonas;
const defaultPersona =
    personaOptions.find((persona) => persona.id === 'dchat') || personaOptions[0];

export const activePersonaId = writable(defaultPersona.id);
export const activePersona = derived(activePersonaId, ($id) => {
    return personaOptions.find((persona) => persona.id === $id) || defaultPersona;
});

export function setActivePersona(id) {
    const persona = personaOptions.find((option) => option.id === id) || defaultPersona;
    activePersonaId.set(persona.id);
    messages.set([]);
}

// Utility to count simple whitespace-separated tokens
export function countTokens(content) {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
}
