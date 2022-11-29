<script>
    import { writable, get } from "svelte/store";
    import { onMount } from "svelte";

    export let machineInfo, process, item;
    let storeId, store;

    console.log("machineInfo", machineInfo);
    console.log("process", process);
    console.log("item", item);

    const serverTimestamp = new Date().getTime();
    const machineId = machineInfo.id;

    const processInfoTemplate = {
        stepId: "",
        stepInfo: {}
    };

    onMount(async () => {
        try {
            console.log("generating storeId");
            storeId = `machine-${machineInfo.id}-process-${process.id}-item-${item.id}`;
            console.log("storeId", storeId);
            store = writable(localStorage.getItem(storeId) || JSON.stringify(processInfoTemplate));

            store.subscribe((value) => {
                localStorage.setItem(storeId, value);
            });

            const processInfo = JSON.parse(localStorage.getItem(storeId));

            if (processInfo.stepId === "") {
                console.log("processInfo.stepId is empty");

                addButton("Start", () => {
                    console.log("Start");
                });
            } else {
                addButton("Continue"), () => {
                    console.log("continue");
                };
            }
        } catch (e) { 
            console.log(e);
        }
    });

    // function that prepends an HTML button to the log div
    function addButton(buttonText, buttonCallback) {
        const logDiv = document.getElementById("log");
        const button = document.createElement("button");
        button.innerHTML = buttonText;
        button.className = "btn";

        button.onclick = buttonCallback;
        logDiv.prepend(button);
    }

    function hideElement(elementId) {
        const element = document.getElementById(elementId);
        element.style.opacity = '0';
    }

    function log(message) {
        const logDiv = document.getElementById("log");
        const p = document.createElement("p");
        p.innerHTML = message;
        logDiv.prepend(p);
    }
</script>

<div class="main">
    <div id="log" />
</div>

<style>
    #log {
        display: flex;
        flex-direction: column;
    }
    
	:global(.btn) {
        background-color: #2f5b2f;
		color: white;
		border-radius: 100px;
		text-decoration: none;
        padding: 10px;
        margin: 5px;
        width: fit-content;
        opacity: 0.8;
        -webkit-transition: 200ms linear;
        transition: 200ms linear;
        border: none;
        font-size: 1em;
        
        /* Start the shake animation and make the animation last for 0.5 seconds */
        animation: shake 20s;

        /* When the animation is finished, start again */
        animation-iteration-count: infinite;
	}

    :global(.btn):hover {
        opacity: 1;
        transition-duration: 0.1s;
        cursor: pointer;
        font-size: 1.1em;
        box-shadow: 0 0 5px 2px #245224;
        
        /* Start the shake animation and make the animation last for 0.5 seconds */
        animation: shake 20s;

        /* When the animation is finished, start again */
        animation-iteration-count: infinite;
    }
    
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-2px, 0px) rotate(1deg); }
        30% { transform: translate(2px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-2px, 1px) rotate(0deg); }
        70% { transform: translate(2px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
</style>