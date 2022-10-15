<script>
    import { tweened } from "svelte/motion";
    import { prettyPrintDuration } from "../../../utils.js";
    export let printInfo, machineInfo, cooldown;
    let traversed = {};
    let discovered = {};
    let nodes = {};
    let edges = {};

    for (const k in machineInfo.nodes) {
        const node = machineInfo.nodes[k];
        nodes[node.id] = node;
    }

    for (const k in machineInfo.edges) {
        const edge = machineInfo.edges[k];
        if (edges[edge.from] === undefined) {
            edges[edge.from] = [];
        }
        edges[edge.from].push(edge);
    }

    function removeElementById(id) {
        const element = document.getElementById(id);
        element.parentNode.removeChild(element);
    }

    function addElement(element, contents, className, id) {
        const newElement = document.createElement(element);
        newElement.innerHTML = contents;
        
        if (className !== undefined) {
            newElement.className = className;
        }

        if (id !== undefined) {
            newElement.id = id;
        }

        document.getElementById("addItem").prepend(newElement);
    }

    function addButton(id, text, href) {
        addElement("button", text, "btn", `button-${id}`);
        document.getElementById(`button-${id}`).addEventListener("click", () => {
            onTraverse(id);
        });
    }

    function addLink(text, href) {
        const link = document.createElement("a");
        const linkText = document.createTextNode(text);
        link.setAttribute("href", href);
        link.appendChild(linkText);
        link.className = "btn";
        document.getElementById("addItem").prepend(link);
    }

    function addTimedTask(id, text, duration, callback) {


        const progress = tweened(0, {
            duration: duration * 1000
        });

        let milestones = [];

        for (const k in edges[id]) {
            const edge = edges[id][k];
            const node = nodes[edge.to];
            const afterElapsed = node.afterElapsed;

            if (afterElapsed !== undefined) {
                const milestone = {
                    id: node.id,
                    afterElapsed: afterElapsed
                };
                milestones.push(milestone);
            }
        }

        const progressBar = document.createElement("progress");
        progressBar.id=`progress-${id}`;
        progressBar.value = 0;
        document.getElementById("addItem").prepend(progressBar);
        addElement("div", "", "progress-bar-text", `progress-bar-text-${id}`);
        addElement("div", "", "progress-bar", `progress-bar-${id}`);
        addElement("div", text, "timed-task", `timed-task-${id}`);

        progress.set(1);
        progress.subscribe(value => {
            const secondsLeft = duration * (1 - value);
            const secondsElapsed = duration * value;
            const prettyDuration = prettyPrintDuration(secondsLeft);
            document.getElementById(`progress-${id}`).value = value;
            document.getElementById(`progress-bar-text-${id}`).innerHTML = `${(value * 100).toFixed(4)}% (${prettyDuration})`;

            if (value >= 1) {
                callback();
            }

            if (milestones.length > 0) {
                if (secondsElapsed >= milestones[0].afterElapsed) {
                    const milestone = milestones.shift();
                    addButton(milestone.id, nodes[milestone.id].title);
                }
            }
        });
    }

    function removeButtonById(id) {
        removeElementById(`button-${id}`);
    }

    function addLog(text) {
        const timestamp = new Date().toLocaleTimeString();
        addElement("p", `${timestamp}: ${text}`);
    }

    function pruneUnexplored(id) {
        const edgeList = edges[id];
        try {
            edgeList.forEach(edge => {
                if (nodes[edge.to].pruneIfUnexplored) {
                    removeButtonById(edge.to);
                }
            });
        } catch (e) {}
    }

    function onStart() {
        removeElementById("start");
        
        addLog("Checking for available printers...");

        if (cooldown) {
            if (cooldown >= 0) {
                addLog("No available printers.");
                return;
            }
        }

        addLog("Printer found: " + machineInfo.name);


        const start = nodes[machineInfo.start];
        if (start === undefined) {
            addLog("Could not find machine instructions.");
        } else {
            addButton(start.id, start.title);
        }
    }

    function onTraverse(id) {
        removeButtonById(id);

        const node = nodes[id];

        if (node === undefined) {
            addLog("Could not find machine instructions.");
        } else {
            addTimedTask(id, node.progressText, node.durationSeconds, () => {
                addLog(node.doneText);
                traversed[id] = true;
                if (edges[id] !== undefined) {
                    for (const k in edges[id]) {
                        const edge = edges[id][k];
                        if (traversed[edge.to] === undefined) {
                            discovered[edge.to] = true;
                            if (nodes[edge.to].afterElapsed === undefined) {
                                addButton(edge.to, nodes[edge.to].title);
                            }
                        }
                    }
                }
                pruneUnexplored(id);

                if (id == machineInfo.end) {
                    addLog("Finished!");
                    addLink('Claim your item', `/inventory/add/${printInfo.id}/confirmation`);
                }
            });
        }

    }
</script>

<div>
    <p>The timing of each step is not final yet. It will eventually be as close to realtime as possible.</p> 
    <h3>Build log</h3>
    <span id="addItem" />
    <button id="start" class="btn" on:click|once={onStart}>Start</button>
</div>

<style>
	:global(.btn) {
        background-color: #2f5b2f;
		color: white;
		border-radius: 100px;
		text-decoration: none;
        padding: 10px;
        margin: 5px;
        width: fit-content;
        opacity: 0.8;
        font-size: 1em;
        border: none;
	}

    :global(.btn):hover {
        opacity: 1;
        transition-duration: 0.5s;
        cursor: pointer;
    }
</style>