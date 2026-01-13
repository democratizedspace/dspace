<script>
    /**
     * @typedef {Object} DocLink
     * @property {string} title
     * @property {string} href
     * @property {string[]=} keywords
     * @property {boolean=} external
     * @property {string[]=} features
     * @property {string=} bodyText
     */

    /**
     * @typedef {Object} DocsSection
     * @property {string} title
     * @property {DocLink[]} links
     */

    import { findDocSnippet, parseDocsQuery } from '../../lib/docs/fullTextSearch';

    /** @type {DocsSection[]} */
    export let sections = [];

    let query = '';

    const normalize = (value) => value.toLowerCase().trim();

    // Note: `keywords` may be an empty array for operator-only queries (e.g. "has:link").
    // In that case, `every()` returns `true` by design, so word matching does not filter out
    // results.
    const matchesWords = (terms, values) =>
        terms.every((term) => values.some((value) => value.includes(term)));

    const matchesOperators = (operators, features = []) => {
        if (!operators.length) {
            return true;
        }

        const normalizedFeatures = features.map(normalize);
        return operators.every((operator) => normalizedFeatures.includes(operator));
    };

    const matchLink = (link, parsedQuery) => {
        if (!parsedQuery.operators.length && !parsedQuery.keywords.length) {
            return true;
        }

        const searchableValues = [link.title, ...(link.keywords ?? []), link.bodyText ?? ''].map(
            normalize
        );

        return (
            matchesWords(parsedQuery.keywords, searchableValues) &&
            matchesOperators(parsedQuery.operators, link.features)
        );
    };

    $: parsedQuery = parseDocsQuery(query);
    $: filteredSections = sections
        .map((section) => ({
            title: section.title,
            links: section.links
                .map((link) => ({
                    ...link,
                    snippet:
                        parsedQuery.keywords.length && !parsedQuery.isHasPredicate
                            ? findDocSnippet(link, parsedQuery.keywords)
                            : null,
                }))
                .filter((link) => matchLink(link, parsedQuery)),
        }))
        .filter((section) => section.links.length > 0);

    $: totalResults = filteredSections.reduce((count, section) => count + section.links.length, 0);
</script>

<div class="docs-index">
    <label class="sr-only" for="docs-search-input">Search docs</label>
    <input
        id="docs-search-input"
        type="search"
        bind:value={query}
        placeholder="Search docs"
        aria-label="Search docs"
    />

    {#if parsedQuery.normalized && totalResults === 0}
        <p class="empty-state">No docs found for "{query}".</p>
    {:else}
        <div class="docs-grid" data-testid="docs-grid">
            {#each parsedQuery.normalized ? filteredSections : sections as section}
                <section class="docs-section">
                    <h2>{section.title}</h2>
                    <nav aria-label={`Docs ${section.title}`}>
                        {#each section.links as link}
                            <div class="doc-link">
                                <a
                                    href={link.href}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    target={link.external ? '_blank' : undefined}
                                >
                                    {link.title}
                                </a>
                                {#if link.snippet}
                                    <p class="doc-snippet">
                                        {@html link.snippet.snippetHtml}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </nav>
                </section>
            {/each}
        </div>
    {/if}
</div>

<style>
    .docs-index {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        align-items: center;
        width: 100%;
    }

    input {
        width: 100%;
        max-width: 28rem;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.75);
    }

    .docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1.5rem;
        width: 100%;
    }

    .docs-section {
        background-color: #2f5b2f;
        border-radius: 2rem;
        padding: 1.25rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h2 {
        color: white;
        margin: 0;
    }

    nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
    }

    .doc-link {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: center;
    }

    a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1rem;
        background-color: #84d484;
        border-radius: 999px;
        color: black;
        text-decoration: none;
        white-space: nowrap;
        opacity: 0.85;
        transition: opacity 0.2s ease-in-out;
    }

    .doc-snippet {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.9);
    }

    .doc-snippet strong {
        font-weight: 700;
        color: #ffffff;
    }

    a:hover,
    a:focus {
        opacity: 1;
    }

    .empty-state {
        background-color: #2f5b2f;
        border-radius: 2rem;
        padding: 1.5rem;
        color: white;
        text-align: center;
        width: 100%;
        max-width: 32rem;
    }

    .sr-only {
        border: 0;
        clip: rect(0 0 0 0);
        height: 1px;
        width: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        position: absolute;
    }
</style>
