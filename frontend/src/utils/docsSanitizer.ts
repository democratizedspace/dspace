import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

import { fixMarkdownText } from '../utils.js';

const DOMPurify = createDOMPurify(new JSDOM('').window as unknown as Window);

const forbiddenDocTags = ['style', 'script'];

export const sanitizeDocsHtml = (text: string): string =>
    DOMPurify.sanitize(fixMarkdownText(text), {
        FORBID_TAGS: forbiddenDocTags,
    });
