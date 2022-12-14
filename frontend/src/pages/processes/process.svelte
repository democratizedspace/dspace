<script>
    import { onMount } from "svelte";
    import { prettyPrintDuration, durationInSeconds } from "../../utils";
    import processes from './processes.json';

    export let processId, machineCount = 0;

    const process = processes.find(p => p.id === processId);
    const machineLockKey = `machine-lock-${process.machine}`;

    const duration = durationInSeconds(process.duration);

    let progressBar, progressPercent = 0, startTime, progressIntervalId;
    let timeLeftDuration = getTimeLeftDuration();

    onMount(async () => {
        // Get a reference to the progress bar element
        progressBar = document.getElementById('progress');

        // Check localStorage for a saved start time
        startTime = localStorage.getItem(`process-${processId}-starttime`);

        // if startTime is set, remove the Start button and start the progress bar
        if (startTime) {
            initializeProgressBar();
        } else {
            if (isMachineAvailable(process.machine) || !process.machine) {
                // add a Start button to #actionlist
                const startButton = document.createElement("button");
                startButton.id = "start";
                startButton.innerHTML = "Start Process";
                startButton.onclick = startProcess;
                startButton.style.cssText = "color: black; background-color: #4CAF50; text-decoration: none; padding: 5px; border-radius: 10px; font-size: 16px; border: none;";
                
                document.getElementById('actionlist').appendChild(startButton);
            } else {
                // add a message to #actionlist
                const message = document.createElement("div");
                message.innerHTML = "This machine is currently unavailable. Please try again later.";
                
                
                document.getElementById('actionlist').appendChild(message);
            }
        }
    });


    // Function to start the task
    function startProcess() {
        startTime = new Date().getTime();
        
        // save the start time to localStorage so we can resume the task later
        localStorage.setItem(`process-${processId}-starttime`, startTime);

        // lock the machine
        lockMachine(process.machine);

        // delete the start button from #container
        document.getElementById('actionlist').removeChild(document.getElementById('start'));

        // Update the progress bar every second
        initializeProgressBar();
    }

    function getTimeLeftDuration() {
        // estimate time left in seconds based on duration and progressPercent
        const timeLeft = duration - (duration * (progressPercent / 100));
        return prettyPrintDuration(timeLeft);
    }

    function initializeProgressBar() {
        progressIntervalId = setInterval(function() {
            if (progressPercent >= 100) {
                progressPercent = 100;
                progressBar.style.width = progressPercent + '%';
                timeLeftDuration = getTimeLeftDuration();

                clearInterval(progressIntervalId);

                // create a finalize button that calls finalize() when clicked
                const finalizeButton = document.createElement("button");
                finalizeButton.id = "finalize";
                finalizeButton.innerHTML = "Finalize";
                finalizeButton.onclick = finalize;
                finalizeButton.style.cssText = "color: black; background-color: #4CAF50; text-decoration: none; padding: 5px; border-radius: 10px; font-size: 16px; border: none;";
                document.getElementById('actionlist').appendChild(finalizeButton);
            } else {
                const currentTime = new Date().getTime();
                const elapsedSeconds = (currentTime - startTime) / 1000;

                progressPercent = (elapsedSeconds / duration) * 100;
                progressBar.style.width = progressPercent + '%';
                
                timeLeftDuration = getTimeLeftDuration();
            }
        }, 100);
    }

    function finalize() {
        // remove the finalize button
        document.getElementById('actionlist').removeChild(document.getElementById('finalize'));

        // remove the time left element
        document.getElementById('container').removeChild(document.getElementById('duration'));

        // remove the progress bar
        document.getElementById('container').removeChild(document.getElementById('progress'));

        // remove the start time from localStorage
        localStorage.removeItem(`process-${processId}-starttime`);

        // unlock the machine
        unlockMachine(process.machine);
        
        const claimLink = document.createElement("a");
        claimLink.href = `/processes/${processId}/confirm`;
        
        // Add the folowing CSS to the div:
        claimLink.style.cssText = "color: black; background-color: #4CAF50; text-decoration: none; padding: 5px; border-radius: 10px; font-size: 16px;";

        claimLink.innerHTML = "Claim your items!";

        document.getElementById('actionlist').prepend(claimLink);
    }

    function isMachineAvailable () {
        const machineLock = parseInt(localStorage.getItem(machineLockKey)) | 0;

        const machineAvailable = Math.max(machineCount - machineLock, 0);

        return machineAvailable > 0;
    }

    function lockMachine () {
        const machineLock = parseInt(localStorage.getItem(machineLockKey)) | 0;

        localStorage.setItem(machineLockKey, machineLock + 1);
    }

    function unlockMachine () {
        const machineLock = parseInt(localStorage.getItem(machineLockKey)) | 0;

        const newLockValue = Math.max(machineLock - 1, 0);

        if (newLockValue <= 0) {
            localStorage.removeItem(machineLockKey);
        } else {
            localStorage.setItem(machineLockKey, newLockValue);
        }
    }
</script>

<div id="container">
    <div id="duration">Time left: {timeLeftDuration}</div>
    <div id="progress" />
    <div id="actionlist">
    </div>
</div>

<style>
    #progress {
        width: 0%;
        height: 20px;
        background-color: #4CAF50;
    }

    button {
        background-color: #4CAF50;
        border: none;
        color: black;
        padding: 5px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        cursor: pointer;
        border-radius: 10px;
    }

    #actionlist {
        display: flex;
        flex-direction: row;
        margin-top: 20px;
    }
</style>