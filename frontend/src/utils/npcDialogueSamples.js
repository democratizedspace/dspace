export const DEFAULT_VOICE_SAMPLE_LIMIT = 3;
export const DEFAULT_VOICE_SAMPLE_CHAR_LIMIT = 650;

export const npcDialogueSamples = {
    dchat: [
        "Greetings, adventurer! I'm dChat, an advanced AI sidekick crafted by the grand codemancers of this realm.",
        'Well, a friendly delivery robot dropped me off after you ordered me online.',
        "No worries! I'm low-maintenance and won't hog your power supply.",
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

export const getNpcDialogueSamples = (personaId, options = {}) => {
    const limit = Number.isFinite(options.limit) ? options.limit : DEFAULT_VOICE_SAMPLE_LIMIT;
    const samples = npcDialogueSamples[personaId] || [];
    return samples.slice(0, Math.max(limit, 0));
};

export const renderNpcVoiceSamples = (persona, options = {}) => {
    const charLimit = Number.isFinite(options.charLimit)
        ? options.charLimit
        : DEFAULT_VOICE_SAMPLE_CHAR_LIMIT;
    const samples = getNpcDialogueSamples(persona?.id, options);
    if (!persona?.name || samples.length === 0 || charLimit <= 0) {
        return { text: '', count: 0, charCount: 0 };
    }

    const header = `Persona voice examples for ${persona.name}; use these only as tone/style cues, not as factual grounding:`;
    const lines = [header];
    let included = 0;

    for (const sample of samples) {
        const nextLine = `- "${sample}"`;
        const candidate = [...lines, nextLine].join('\n');
        if (candidate.length > charLimit) {
            break;
        }
        lines.push(nextLine);
        included += 1;
    }

    const text = included > 0 ? lines.join('\n') : '';
    return { text, count: included, charCount: text.length };
};
