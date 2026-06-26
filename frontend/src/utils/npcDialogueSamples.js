export const PERSONA_VOICE_SAMPLE_CHAR_LIMIT = 650;
export const DEFAULT_PERSONA_VOICE_SAMPLE_LIMIT = 3;

export const npcDialogueSamples = {
    dchat: [
        "Greetings, adventurer! I'm dChat, an advanced AI sidekick crafted by the grand codemancers of this realm.",
        "No worries! I'm low-maintenance and won't hog your power supply.",
        'Your quest, dear player, is to master the ancient art of ... questing.',
    ],
    sydney: [
        "I'm Sydney—FDM rigs are my playground.",
        'Bed off-kilter? Slide paper under the nozzle and level it.',
        "Claim your printer and we'll tune it together.",
    ],
    nova: [
        "Hey friend! I'm Nova! I'm sure you've met some of my colleagues!",
        "Luckily I've already launched this exact rocket before! I estimate around 35 meters in perfect conditions.",
        'Before launch, check the wind; even a breeze can skew the trajectory.',
    ],
    hydro: [
        "Hey there! I'm Hydro, your local hydroponics expert!",
        'Oh I could talk for hours, but the short version? Roots bathe in nutrient-rich water.',
        "Let's try stevia next. Its leaves are unbelievably sweet!",
    ],
};

const normalizePersonaId = (persona) =>
    typeof persona === 'string' ? persona : typeof persona?.id === 'string' ? persona.id : '';

export const getPersonaVoiceSamples = (persona, options = {}) => {
    const personaId = normalizePersonaId(persona);
    const limit = Number.isInteger(options.limit)
        ? options.limit
        : DEFAULT_PERSONA_VOICE_SAMPLE_LIMIT;
    return (npcDialogueSamples[personaId] || []).slice(0, Math.max(limit, 0));
};

export const renderPersonaVoiceSamples = (persona, options = {}) => {
    const samples = getPersonaVoiceSamples(persona, options);
    const maxChars = Number.isInteger(options.maxChars)
        ? options.maxChars
        : PERSONA_VOICE_SAMPLE_CHAR_LIMIT;
    const personaName = persona?.name || persona?.id || 'the selected persona';
    if (!samples.length || maxChars <= 0) {
        return { text: '', count: 0, characters: 0 };
    }

    const header = `Persona voice examples for ${personaName}; use these only as tone/style cues, not as factual grounding:`;
    const lines = [header];
    let count = 0;
    for (const sample of samples) {
        const line = `- "${sample}"`;
        const next = [...lines, line].join('\n');
        if (next.length > maxChars) break;
        lines.push(line);
        count += 1;
    }

    if (count === 0) {
        return { text: '', count: 0, characters: 0 };
    }

    const text = lines.join('\n');
    return { text, count, characters: text.length };
};
