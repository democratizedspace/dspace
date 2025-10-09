async function scoreQuest(dialogue) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // simple heuristic fallback
        return dialogue.length > 100 ? 0.8 : 0.5;
    }
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });
    const prompt = `Rate the following quest dialogue from 0 to 1 for quality only return the number:\n${dialogue}`;
    const res = await openai.responses.create({
        model: 'gpt-5-chat-latest',
        input: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ],
    });
    const text = (res.output_text || '').trim();
    const num = parseFloat(text);
    return isNaN(num) ? 0.5 : num;
}

module.exports = { scoreQuest };
