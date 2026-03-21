import { readFileSync } from 'node:fs';
import path, { join } from 'node:path';

import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

type PackageScripts = Record<string, string>;

type ScriptRefs = {
    root: Set<string>;
    frontend: Set<string>;
};

const repoRoot = join(__dirname, '..');
const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    scripts?: PackageScripts;
};
const frontendPackage = JSON.parse(
    readFileSync(join(repoRoot, 'frontend', 'package.json'), 'utf8')
) as {
    scripts?: PackageScripts;
};

const rootScripts = rootPackage.scripts ?? {};
const frontendScripts = frontendPackage.scripts ?? {};

function extractScriptRefs(content: string): ScriptRefs {
    const refs: ScriptRefs = {
        root: new Set<string>(),
        frontend: new Set<string>(),
    };

    for (const match of content.matchAll(/npm\s+--prefix\s+frontend\s+run\s+([\w:-]+)/g)) {
        refs.frontend.add(match[1]);
    }

    for (const match of content.matchAll(/cd\s+frontend\s*&&\s*npm\s+run\s+([\w:-]+)/g)) {
        refs.frontend.add(match[1]);
    }

    for (const match of content.matchAll(/npm\s+run\s+([\w:-]+)/g)) {
        refs.root.add(match[1]);
    }

    if (/\bnpm\s+test\b/.test(content)) {
        refs.root.add('test');
    }

    return refs;
}

function commandSegments(command: string): string[] {
    return command
        .split(/&&|\|\|/)
        .map((segment) => segment.trim())
        .filter(Boolean);
}

function normalizeSegment(segment: string): string {
    return segment
        .replace(/^\(?\s*/, '')
        .replace(/\s*\)?$/, '')
        .replace(/^(?:[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+)+/, '')
        .trim();
}

function firstToken(segment: string): string {
    return segment.split(/\s+/)[0] ?? '';
}

function validateNodeEntrypoint(segment: string, baseDir: string, scriptName: string): string | null {
    const nodeInvocation = segment.match(/^node\s+([^\s]+)/);
    if (!nodeInvocation) {
        return null;
    }

    const entry = nodeInvocation[1];
    if (entry.startsWith('-') || entry.startsWith('http://') || entry.startsWith('https://')) {
        return null;
    }

    const absolute = path.isAbsolute(entry) ? entry : join(baseDir, entry);
    if (!absolute.startsWith(baseDir) || !entry.includes('/')) {
        return null;
    }

    return absolute;
}

function collectIssuesForScript(
    packageName: 'root' | 'frontend',
    scripts: PackageScripts,
    scriptName: string,
    seen: Set<string>
): string[] {
    const key = `${packageName}:${scriptName}`;
    if (seen.has(key)) {
        return [];
    }
    seen.add(key);

    const command = scripts[scriptName];
    if (!command) {
        return [`Missing ${packageName} npm script: ${scriptName}`];
    }

    const baseDir = packageName === 'root' ? repoRoot : join(repoRoot, 'frontend');
    const issues: string[] = [];

    for (const rawSegment of commandSegments(command)) {
        const segment = normalizeSegment(rawSegment);
        if (!segment || segment.startsWith('cd ')) {
            continue;
        }

        const nestedRun = segment.match(/^npm\s+run\s+([\w:-]+)/);
        if (nestedRun) {
            issues.push(...collectIssuesForScript(packageName, scripts, nestedRun[1], seen));
            continue;
        }

        const crossRun = segment.match(/^npm\s+--prefix\s+frontend\s+run\s+([\w:-]+)/);
        if (crossRun) {
            issues.push(...collectIssuesForScript('frontend', frontendScripts, crossRun[1], seen));
            continue;
        }

        const entrypoint = validateNodeEntrypoint(segment, baseDir, scriptName);
        if (entrypoint && !globSync(entrypoint).length) {
            issues.push(
                `${packageName} script "${scriptName}" references missing Node entrypoint: ${entrypoint}`
            );
        }

        if (/node_modules\/.+\/cli(?:\.js)?\b/.test(segment)) {
            issues.push(
                `${packageName} script "${scriptName}" hard-codes a node_modules CLI path: ${segment}`
            );
        }

        const commandName = firstToken(segment);
        if (commandName === 'vitest') {
            const vitestBin = join(repoRoot, 'node_modules', '.bin', 'vitest');
            if (!globSync(vitestBin).length) {
                issues.push(`${packageName} script "${scriptName}" depends on vitest binary not found at ${vitestBin}`);
            }
        }
    }

    return issues;
}

describe('npm script reachability from CI/docs references', () => {
    it('keeps referenced root/frontend npm scripts defined with basic static sanity checks', () => {
        const files = globSync(['.github/workflows/**/*.{yml,yaml}', 'AGENTS.md', 'README.md', 'docs/**/*.md'], {
            cwd: repoRoot,
            nodir: true,
        });

        const refs: ScriptRefs = {
            root: new Set<string>(),
            frontend: new Set<string>(),
        };

        for (const file of files) {
            const content = readFileSync(join(repoRoot, file), 'utf8');
            const extracted = extractScriptRefs(content);
            extracted.root.forEach((script) => refs.root.add(script));
            extracted.frontend.forEach((script) => refs.frontend.add(script));
        }

        const issues: string[] = [];
        const seen = new Set<string>();

        for (const script of refs.root) {
            issues.push(...collectIssuesForScript('root', rootScripts, script, seen));
        }

        for (const script of refs.frontend) {
            issues.push(...collectIssuesForScript('frontend', frontendScripts, script, seen));
        }

        expect(issues).toEqual([]);
    });
});
