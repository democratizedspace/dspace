export const PERSONA_VOICE_SAMPLE_MAX_CHARS = 650;
export const PERSONA_VOICE_SAMPLE_DEFAULT_LIMIT = 3;

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

const normalizePersonaId = (persona) => {
    if (typeof persona === 'string') return persona;
    return typeof persona?.id === 'string' ? persona.id : '';
};

export const getPersonaVoiceSamples = (
    persona,
    { limit = PERSONA_VOICE_SAMPLE_DEFAULT_LIMIT } = {}
) => {
    const personaId = normalizePersonaId(persona);
    const samples = npcDialogueSamples[personaId] || [];
    return samples.slice(0, Math.max(0, limit));
};

export const renderPersonaVoiceSamples = (
    persona,
    { limit = PERSONA_VOICE_SAMPLE_DEFAULT_LIMIT, maxChars = PERSONA_VOICE_SAMPLE_MAX_CHARS } = {}
) => {
    const samples = getPersonaVoiceSamples(persona, { limit });
    if (samples.length === 0) {
        return { block: '', count: 0, characters: 0 };
    }

    const personaName = persona?.name || persona?.id || 'selected persona';
    const header =
        `Persona voice examples for ${personaName}; use these only as tone/style cues, ` +
        'not as factual grounding:';
    const lines = [header];
    let included = 0;

    for (const sample of samples) {
        const line = `- "${sample}"`;
        const nextBlock = [...lines, line].join('\n');
        if (nextBlock.length > maxChars) break;
        lines.push(line);
        included += 1;
    }

    if (included === 0) {
        return { block: '', count: 0, characters: 0 };
    }

    const block = lines.join('\n');
    return { block, count: included, characters: block.length };
};
