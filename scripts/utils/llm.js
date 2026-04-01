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
        model: 'gpt-5.2',
        input: [
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: prompt,
                    },
                ],
            },
        ],
    });
    const extractOutputText = (response) => {
        if (!response) return '';
        if (typeof response.output_text === 'string' && response.output_text.trim()) {
            return response.output_text;
        }
        const outputContent = response.output?.flatMap((entry) => entry.content || []);
        const outputText = outputContent?.find((block) => block.type === 'output_text')?.text;

        return outputText || '';
    };

    const text = extractOutputText(res).trim();
    const num = parseFloat(text);
    return isNaN(num) ? 0.5 : num;
}

module.exports = { scoreQuest };
