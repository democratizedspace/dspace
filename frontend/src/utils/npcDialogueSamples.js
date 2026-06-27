export const PERSONA_VOICE_SAMPLE_CHAR_LIMIT = 650;
export const DEFAULT_PERSONA_VOICE_SAMPLE_COUNT = 3;

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
        "Nahhh, you're good! According to the FAA, without additional paperwork, the rocket may weigh no more than 1500 grams.",
        'Before launch, check the wind; even a breeze can skew the trajectory.',
    ],
    hydro: [
        "Hey there! I'm Hydro, your local hydroponics expert!",
        'Oh I could talk for hours, but the short version? Roots bathe in nutrient-rich water.',
        "Let's try stevia next. Its leaves are unbelievably sweet!",
    ],
};

export const getPersonaVoiceSamples = (
    personaId,
    { limit = DEFAULT_PERSONA_VOICE_SAMPLE_COUNT } = {}
) => {
    const samples = npcDialogueSamples[String(personaId || '').toLowerCase()] || [];
    return samples.slice(0, limit);
};

export const renderPersonaVoiceSamples = (
    persona,
    { count = DEFAULT_PERSONA_VOICE_SAMPLE_COUNT, charLimit = PERSONA_VOICE_SAMPLE_CHAR_LIMIT } = {}
) => {
    const samples = getPersonaVoiceSamples(persona?.id, { limit: count });
    if (!samples.length) {
        return { block: '', count: 0, characters: 0 };
    }

    const header = `Persona voice examples for ${persona?.name || persona?.id}; use these only as tone/style cues, not as factual grounding:`;
    const rendered = [];
    let block = header;

    for (const sample of samples) {
        const line = `- "${sample}"`;
        const nextBlock = `${block}\n${line}`;
        if (nextBlock.length > charLimit) break;
        rendered.push(sample);
        block = nextBlock;
    }

    if (!rendered.length) {
        return { block: '', count: 0, characters: 0 };
    }

    return { block, count: rendered.length, characters: block.length };
};
