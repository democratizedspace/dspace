import processes from './processes.json';

// create a ProcessStatus enum with values 'IDLE', 'IN_PROGRESS', 'COMPLETE'
export const ProcessStatus = {
    IDLE: 'IDLE',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETE: 'COMPLETE'
};

export const getProcess = (processId) => {
    const process = processes.find((process) => process.id === processId);
    return process;
}

export const processInProgress = (processId) => {
    const inProgress = localStorage.getItem(`process-${processId}`);
    return inProgress !== null;
};

export const machineAvailable = (processId, machinesInInventory) => {
    const process = getProcess(processId);
    const machine = process.machine;

    if (machine) {
        const machineLock = localStorage.getItem(`machine-lock-${machine}`) || 0;
        return machineLock < machinesInInventory;
    }
    return true;
}

export const getProcessStatus = (processId) => {
    if (processInProgress(processId)) {
        return ProcessStatus.IN_PROGRESS;
    }
    return ProcessStatus.IDLE;
};