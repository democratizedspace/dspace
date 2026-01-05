import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOCS_MD_DIR = path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md');
const EXTERNAL_LINK_PATTERN = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];
const BLOCKED_HOSTNAMES = ['example.com', 'token.placeholder', '0.0.0.0'];

describe('Docs external links', () => {
    it('avoid insecure or placeholder external URLs', () => {
        const docFiles = globSync(path.join(DOCS_MD_DIR, '**/*.md'));
        const badLinks: Array<{ file: string; link: string; reason: string }> = [];

        docFiles.forEach((filePath) => {
            const content = readFileSync(filePath, 'utf8');
            let match;
            while ((match = EXTERNAL_LINK_PATTERN.exec(content)) !== null) {
                const rawLink = match[1];
                try {
                    const parsed = new URL(rawLink);
                    const host = parsed.hostname.toLowerCase();
                    const isLocal = LOCAL_HOSTNAMES.includes(host);
                    if (!isLocal && parsed.protocol !== 'https:') {
                        badLinks.push({ file: filePath, link: rawLink, reason: 'insecure' });
                        continue;
                    }

                    if (BLOCKED_HOSTNAMES.includes(host) || host.endsWith('.invalid')) {
                        badLinks.push({ file: filePath, link: rawLink, reason: 'placeholder' });
                    }
                } catch (error) {
                    badLinks.push({ file: filePath, link: rawLink, reason: 'unparseable' });
                }
            }
        });

        expect(badLinks).toEqual([]);
    });
});
