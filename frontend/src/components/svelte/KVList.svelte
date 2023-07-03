<script>
    export let items = [];
</script>

<table>
    <thead>
        <tr>
            <th>Key</th>
            <th>Value</th>
        </tr>
    </thead>
    <tbody>
        {#each items as item (item.key)}
            <tr>
                <td class="key">{item.key}</td>
                <td>{item.value}</td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    table {
        table-layout: auto;
        width: 100%;
        word-break: break-word;
    }

    th, td {
        text-align: center;
        padding: 8px;
        color: black;
        overflow: hidden;
    }

    thead {
        background-color: #4CAF50;
    }

    tbody tr:nth-child(even) {
        background-color: #C8E6C9;
    }

    tbody tr:nth-child(odd) {
        background-color: #A5D6A7;
    }

    .key {
        min-width: 100px;
    }
</style>
