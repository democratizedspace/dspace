<script>
    import { onMount } from "svelte";
    import { getProcessStatus, ProcessStatus, machineAvailable } from './utils.js';

    import processes from './processes.json';

    export let processId, machineCount = 0;

    const process = processes.find(p => p.id === processId);
    
    const processStatus = getProcessStatus(processId);

    console.log('processStatus', processStatus)

    onMount(async () => {
        switch (processStatus) {
            case ProcessStatus.IDLE: 
                if (machineAvailable(processId, machineCount)) {
                    changeStatus('Ready to start');
                    addLink('Start', `/processes/${processId}?action=start`);
                } else {
                    changeStatus('Waiting for machines...');
                }
                break;
            case ProcessStatus.IN_PROGRESS:
                changeStatus('In progress...');
                break;
            case ProcessStatus.COMPLETE:
                changeStatus('Complete!');
                break;
        }
    });

    const changeStatus = (status) => {
        const statusElement = document.getElementById('status');
        statusElement.innerHTML = status;
    };

    const addLink = (text, href) => {
        const link = document.createElement('a');
        link.href = href
        link.innerHTML = text;
        
        document.getElementById('actionList').appendChild(link);
    }
</script>

<div>
    <p id="status">Loading...</p>
    <div id="actionList"></div>
</div>

<style>
</style>