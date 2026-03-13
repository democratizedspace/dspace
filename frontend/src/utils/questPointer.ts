export const resolveQuestPointer = ({
    storedStepId,
    currentPointer,
    dialogueMap,
    questStart,
}: {
    storedStepId: unknown;
    currentPointer: unknown;
    dialogueMap: Map<string, unknown> | undefined;
    questStart: string;
}): string => {
    const hasValidStoredStep =
        typeof storedStepId === 'string' && Boolean(dialogueMap?.has(storedStepId));
    if (hasValidStoredStep) {
        return storedStepId;
    }

    const hasValidCurrentPointer =
        typeof currentPointer === 'string' && Boolean(dialogueMap?.has(currentPointer));
    if (hasValidCurrentPointer) {
        return currentPointer;
    }

    return questStart;
};
