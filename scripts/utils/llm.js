async function scoreQuest(dialogue) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // simple heuristic fallback
        return dialogue.length > 100 ? 0.8 : 0.5;
    }
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });
    const prompt = `Rate the following quest dialogue from 0 to 1 for quality only return the number:\n${dialogue}`;
    const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'user', content: prompt },
        ],
    });
    const text = res.choices[0].message.content.trim();
    const num = parseFloat(text);
    return isNaN(num) ? 0.5 : num;
}

module.exports = { scoreQuest };
