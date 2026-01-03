<script>
    /**
     * @typedef {Object} DocLink
     * @property {string} title
     * @property {string} href
     * @property {string[]=} keywords
     * @property {boolean=} external
     */

    /**
     * @typedef {Object} DocMetadata
     * @property {boolean=} hasLink
     * @property {boolean=} hasImage
     */

    /**
     * @typedef {Object} DocsSection
     * @property {string} title
     * @property {DocLink[]} links
     */

    /** @type {DocsSection[]} */
    export let sections = [];
    /** @type {Record<string, DocMetadata>} */
    export let metadata = {};

    let query = '';

    const normalize = (value) => value.toLowerCase().trim();

    const normalizeHref = (href) => normalize(href.split('#')[0].replace(/\/+$/, ''));

    const SUPPORTED_OPERATORS = {
        link: (docMetadata) => Boolean(docMetadata?.hasLink),
        image: (docMetadata) => Boolean(docMetadata?.hasImage),
    };

    const parseQuery = (value) => {
        if (!value) {
            return { terms: [], operators: [] };
        }

        const tokens = value.split(/\s+/).filter(Boolean);
        const operators = [];
        const terms = [];

        tokens.forEach((token) => {
            if (token.startsWith('has:')) {
                const operator = token.slice(4);
                if (operator in SUPPORTED_OPERATORS) {
                    operators.push(operator);
                    return;
                }
            }

            terms.push(token);
        });

        return { terms, operators };
    };

    const matchesOperators = (link, operators) => {
        if (!operators.length) {
            return true;
        }

        const docMetadata = metadata[normalizeHref(link.href)] ?? {};

        return operators.every((operator) => SUPPORTED_OPERATORS[operator](docMetadata));
    };

    const matchLink = (link, parsedQuery) => {
        const hasOperators = parsedQuery.operators.length > 0;
        const hasTerms = parsedQuery.terms.length > 0;

        if (!hasOperators && !hasTerms) {
            return true;
        }

        const searchableValues = [link.title, ...(link.keywords ?? [])].map(normalize);
        const words = parsedQuery.terms;

        const hasTextMatch =
            words.length === 0
                ? true
                : words.every((word) => searchableValues.some((value) => value.includes(word)));

        if (!hasTextMatch) {
            return false;
        }

        return matchesOperators(link, parsedQuery.operators);
    };

    $: normalizedQuery = normalize(query);
    $: parsedQuery = parseQuery(normalizedQuery);
    $: filteredSections = sections
        .map((section) => ({
            title: section.title,
            links: section.links.filter((link) => matchLink(link, parsedQuery)),
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

    {#if normalizedQuery && totalResults === 0}
        <p class="empty-state">No docs found for "{query}".</p>
    {:else}
        <div class="docs-grid" data-testid="docs-grid">
            {#each normalizedQuery ? filteredSections : sections as section}
                <section class="docs-section">
                    <h2>{section.title}</h2>
                    <nav aria-label={`Docs ${section.title}`}>
                        {#each section.links as link}
                            <a
                                href={link.href}
                                rel={link.external ? 'noopener noreferrer' : undefined}
                                target={link.external ? '_blank' : undefined}
                            >
                                {link.title}
                            </a>
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
