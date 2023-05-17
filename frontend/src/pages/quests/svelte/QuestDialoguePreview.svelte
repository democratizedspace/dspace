<script>
    export let quest;

    const getItemListString = (itemList) => {
        return itemList.map(item => `${item.id}:${item.count}`).join(',');
    };

    const getTypeString = (option) => {
        if (option.type === "goto") {
            if (option.requiresItems) {
                return `requiresItems(${getItemListString(option.requiresItems)})->goto(${option.goto})`;
            }
            return `goto(${option.goto})`;
        }
        if (option.type === "process") {
            return `process(${option.process})`;
        }
        if (option.type === "grantsItems") {
            return `grantsItems(${getItemListString(option.grantsItems)})`;
        }
        if (option.type === "takesItems") {
            return `takesItems(${getItemListString(option.takesItems)})`;
        }
        return option.type;
    };
</script>

<p>
    {#each quest.dialogue as d}
        <h2>{d.id}</h2>
        <h5>NPC:</h5>
        <p>
            {JSON.stringify(d.text)}
        </p>

        <h5>Player:</h5>
        <ol>
        {#each d.options as o}
            <li>
                <strong>{getTypeString(o)}</strong>: {o.text}
            </li>
        {/each}
        </ol>
    {/each}
</p>