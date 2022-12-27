<script>
	function handleClick() {
		alert('no more alerts')
        console.log("yo");
	}

    console.log("hello");
</script>

<div>
    <button on:click|once={handleClick}>
        Click me
    </button>
    <span id="status"></span>
</div>

<style>
    button {
        background-color: #007006;
        border: none;
        color: white;
        padding: 5px 5px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 8px;
        opacity: 0.8;
    }

    button:hover {
        opacity: 1.0
    }
</style>