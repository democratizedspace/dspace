<script>
    import { findDocSnippet, parseDocsQuery } from '../../utils/docsFullTextSearch.js';

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

    /** @type {DocsSection[]} */
    export let sections = [];

    let query = '';

    const normalize = (value = '') => value.toLowerCase().trim();

    // Note: `terms` may be an empty array for operator-only queries (e.g. "has:link").
    // In that case, `every()` returns `true` by design, so word matching does not filter out results.
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

        const searchableValues = [link.title, link.bodyText, ...(link.keywords ?? [])]
            .filter(Boolean)
            .map(normalize);

        return (
            matchesWords(parsedQuery.keywords, searchableValues) &&
            matchesOperators(parsedQuery.operators, link.features)
        );
    };

    $: parsedQuery = parseDocsQuery(query);
    $: isSnippetEnabled =
        parsedQuery.normalized && !parsedQuery.isHasPredicate && parsedQuery.keywords.length > 0;
    $: filteredSections = sections
        .map((section) => ({
            title: section.title,
            links: section.links
                .filter((link) => matchLink(link, parsedQuery))
                .map((link) => ({
                    ...link,
                    snippetData: isSnippetEnabled ? findDocSnippet(link, parsedQuery.keywords) : null,
                })),
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
                            <div class="docs-link">
                                <a
                                    href={link.href}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    target={link.external ? '_blank' : undefined}
                                >
                                    {link.title}
                                </a>
                                {#if link.snippetData}
                                    <p class="docs-snippet">
                                        {#if link.snippetData.snippet.before.length}
                                            {link.snippetData.snippet.before.join(' ')}{' '}
                                        {/if}
                                        <strong>{link.snippetData.snippet.match}</strong>
                                        {#if link.snippetData.snippet.after.length}
                                            {' '}{link.snippetData.snippet.after.join(' ')}
                                        {/if}
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

    .docs-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
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

    a:hover,
    a:focus {
        opacity: 1;
    }

    .docs-snippet {
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        max-width: 16rem;
        text-align: center;
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
