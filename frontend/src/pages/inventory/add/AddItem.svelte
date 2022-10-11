<script>
    import { tweened } from "svelte/motion";
    import { prettyPrintDuration } from "../../../utils.js";
    export let printInfo, machineInfo;
    let traversed = {};
    let discovered = {};
    let nodes = {};
    let edges = [];

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

    console.log(nodes);
    console.log(edges);

    function removeElementById(id) {
        console.log("removing element: ", id);
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
            console.log("adding id to element: ", id);
        }

        console.log("addElement: ", newElement);

        document.getElementById("addItem").appendChild(newElement);
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
        document.getElementById("addItem").appendChild(link);
    }

    function addTimedTask(id, text, duration, callback) {
        addElement("div", text, "timed-task", `timed-task-${id}`);
        addElement("div", "", "progress-bar", `progress-bar-${id}`);
        addElement("div", "", "progress-bar-text", `progress-bar-text-${id}`);

        console.log(`Creating a progress bar with duration ${duration}`);

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
                console.log(`Adding milestone: ${node.id}`);
                milestones.push(milestone);
            }
        }

        console.log("milestones: ", milestones);

        const progressBar = document.createElement("progress");
        progressBar.id=`progress-${id}`;
        progressBar.value = 0;
        document.getElementById("addItem").appendChild(progressBar);

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
                console.log(secondsElapsed);
                if (secondsElapsed >= milestones[0].afterElapsed) {
                    console.log(`Milestone reached: ${milestones[0].id}`);
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

    function onStart() {
        console.log('onStart');
        removeElementById("start");
        addElement("h3", "Build log");
        addLog("Checking for available printers...");
        addLog("Printer found: " + machineInfo.name);


        const start = nodes[machineInfo.start];
        if (start === undefined) {
            addLog("Could not find machine instructions.");
        } else {
            addButton(start.id, start.title);
        }
    }

    function onTraverse(id) {
        console.log('onTraverse: ', id);

        removeButtonById(id);


        if (id == machineInfo.end) {
            addLog("Finished!");
            addLink('Claim your item', `/inventory/${printInfo.id}/confirmation`);
            for (const k in discovered) {
                const id = nodes[k].id;
                console.log("removing button: ", id);
                try {
                    removeButtonById(nodes[k].id);
                } catch (e) {
                    console.log(`couldn't remove button with id: ${id}`);
                }
            }
            return;
        }

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
                            addButton(edge.to, nodes[edge.to].title);
                        }
                    }
                }
            });
        }

    }
</script>

<div id="addItem">
    <p>The timing of each step is not final yet. It will eventually be as close to realtime as possible.</p> 
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