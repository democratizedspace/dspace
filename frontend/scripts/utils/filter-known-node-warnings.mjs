const warningPrefixPattern = /^(?:\[WebServer\]\s*)?/;

const knownExperimentalWarningPatterns = [
    new RegExp(
        String.raw`^CommonJS module .*node_modules[\\/]npm[\\/]node_modules[\\/]debug[\\/]src[\\/]node\.js is loading ES Module .*node_modules[\\/]npm[\\/]node_modules[\\/]supports-color[\\/]index\.js using require\(\)\.?$`
    ),
    new RegExp(
        String.raw`^CommonJS module .*node_modules[\\/](?:\.pnpm[\\/])?@eslint(?:\+|[\\/])eslintrc.*[\\/]dist[\\/]eslintrc\.cjs is loading ES Module .*node_modules[\\/].*svelte-eslint-parser.*[\\/]lib[\\/]index\.js using require\(\)\.?$`
    ),
];

const continuationPatterns = [
    /^Support for loading ES Module in require\(\) is an experimental feature and might change at any time$/,
    /^\(Use `node --trace-warnings \.\.\.` to show where the warning was created\)$/,
];

function stripKnownPrefixes(line) {
    return line.replace(warningPrefixPattern, '');
}

function getExperimentalWarningMessage(line) {
    const unprefixed = stripKnownPrefixes(line);
    const match = unprefixed.match(/^\(node:\d+\) ExperimentalWarning: (.*)$/);
    return match?.[1] ?? null;
}

function isKnownExperimentalWarningStart(line) {
    const message = getExperimentalWarningMessage(line);
    return Boolean(
        message && knownExperimentalWarningPatterns.some((pattern) => pattern.test(message))
    );
}

function isWarningContinuationLine(line) {
    const unprefixed = stripKnownPrefixes(line);
    return continuationPatterns.some((pattern) => pattern.test(unprefixed));
}

export function createKnownNodeWarningFilter() {
    let remainingContinuationLines = 0;

    return (line) => {
        if (isKnownExperimentalWarningStart(line)) {
            remainingContinuationLines = 2;
            return false;
        }

        if (remainingContinuationLines > 0 && isWarningContinuationLine(line)) {
            remainingContinuationLines -= 1;
            return false;
        }

        remainingContinuationLines = 0;
        return true;
    };
}

export function createFilteredWriter(
    stream,
    { shouldKeepLine = createKnownNodeWarningFilter() } = {}
) {
    let buffered = '';

    return (chunk, flush = false) => {
        buffered += chunk;
        const parts = buffered.split('\n');
        buffered = parts.pop() ?? '';

        for (const line of parts) {
            if (shouldKeepLine(line)) {
                stream.write(`${line}\n`);
            }
        }

        if (flush && buffered) {
            if (shouldKeepLine(buffered)) {
                stream.write(buffered);
            }
            buffered = '';
        }
    };
}
